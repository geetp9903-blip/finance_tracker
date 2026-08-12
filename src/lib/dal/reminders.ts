import 'server-only';
import { cache } from 'react';
import { TransactionReminderModel, ReminderStatusModel, TransactionModel, RecurringRuleModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { assertAuth } from './auth';
import { TransactionReminder, MonthlyReminderItem, ReminderStatusState } from '@/lib/types';
import { format, endOfMonth, startOfMonth, parseISO, differenceInDays } from 'date-fns';

/**
 * Ensures legacy RecurringRule documents are migrated to TransactionReminder documents.
 */
async function autoMigrateRecurringRules(userId: string) {
    const existingRemindersCount = await TransactionReminderModel.countDocuments({ userId });
    if (existingRemindersCount > 0) return;

    const legacyRules = await RecurringRuleModel.find({ userId, active: true }).lean();
    if (!legacyRules || legacyRules.length === 0) return;

    const newReminders = legacyRules.map((rule: any) => {
        let dueDay = 1;
        if (rule.nextDueDate) {
            dueDay = new Date(rule.nextDueDate).getDate();
        } else if (rule.startDate) {
            dueDay = new Date(rule.startDate).getDate();
        }

        return {
            id: `rem_${rule.id || rule._id}`,
            userId,
            title: rule.description || `${rule.category} Reminder`,
            amount: rule.amount,
            type: rule.type,
            category: rule.category,
            frequency: rule.frequency || 'monthly',
            dueDay: dueDay > 31 ? 28 : (dueDay < 1 ? 1 : dueDay),
            active: rule.active !== undefined ? rule.active : true,
            startDate: rule.startDate || rule.nextDueDate,
        };
    });

    if (newReminders.length > 0) {
        await TransactionReminderModel.insertMany(newReminders);
    }
}

/**
 * Fetch all reminder templates for current user.
 */
export const getReminderTemplates = cache(async (): Promise<TransactionReminder[]> => {
    const userId = await assertAuth();
    await dbConnect();

    await autoMigrateRecurringRules(userId);

    const templates = await TransactionReminderModel.find({ userId })
        .sort({ dueDay: 1 })
        .lean();

    return templates.map((t: any) => ({
        id: t.id || t._id.toString(),
        userId: t.userId,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        frequency: t.frequency || 'monthly',
        dueDay: t.dueDay || 1,
        active: t.active,
        startDate: t.startDate,
    }));
});

/**
 * Get monthly reminder status items for a specific month/year.
 * Handles 14-day auto-expiration rule.
 */
export const getMonthlyReminders = cache(async (targetYear?: number, targetMonth?: number): Promise<MonthlyReminderItem[]> => {
    const userId = await assertAuth();
    await dbConnect();

    await autoMigrateRecurringRules(userId);

    const now = new Date();
    const year = targetYear || now.getFullYear();
    const month = targetMonth || (now.getMonth() + 1);

    const periodKey = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1. Fetch active templates
    const templates = await TransactionReminderModel.find({ userId, active: true }).lean();

    // 2. Fetch existing status overrides for periodKey
    const statuses = await ReminderStatusModel.find({ userId, periodKey }).lean();
    const statusMap = new Map<string, any>();
    statuses.forEach((s: any) => statusMap.set(s.reminderId, s));

    const todayStr = format(now, 'yyyy-MM-dd');
    const todayDate = parseISO(todayStr);

    const result: MonthlyReminderItem[] = [];
    const statusUpdatesToSave: any[] = [];

    for (const t of templates) {
        const reminderId = t.id || t._id.toString();
        const effectiveDay = Math.min(t.dueDay || 1, daysInMonth);
        const dueDateStr = `${year}-${String(month).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
        const dueDate = parseISO(dueDateStr);

        let status: ReminderStatusState = 'pending';
        let actualAmount = t.amount;
        let paidDate: string | undefined = undefined;
        let paidTransactionId: string | undefined = undefined;

        const existingStatus = statusMap.get(reminderId);
        if (existingStatus) {
            status = existingStatus.status;
            if (existingStatus.actualAmount !== undefined) actualAmount = existingStatus.actualAmount;
            paidDate = existingStatus.paidDate;
            paidTransactionId = existingStatus.paidTransactionId;
        }

        // Calculate days overdue
        let daysOverdue = 0;
        if (dueDate < todayDate && status === 'pending') {
            daysOverdue = differenceInDays(todayDate, dueDate);
            // 14-day auto-expiration rule
            if (daysOverdue > 14) {
                status = 'expired';
                statusUpdatesToSave.push({
                    id: existingStatus?.id || `stat_${reminderId}_${periodKey}`,
                    reminderId,
                    userId,
                    periodKey,
                    status: 'expired',
                });
            }
        }

        result.push({
            id: existingStatus?.id || reminderId,
            reminderId,
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            dueDate: dueDateStr,
            dueDay: t.dueDay,
            status,
            actualAmount,
            paidDate,
            paidTransactionId,
            daysOverdue,
        });
    }

    // Save auto-expired updates asynchronously
    if (statusUpdatesToSave.length > 0) {
        for (const update of statusUpdatesToSave) {
            await ReminderStatusModel.updateOne(
                { reminderId: update.reminderId, periodKey },
                { $set: update },
                { upsert: true }
            );
        }
    }

    return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
});

/**
 * Calculates data for Actual vs Projected Balance line chart.
 */
export const getPredictiveBalanceData = cache(async (targetYear?: number, targetMonth?: number) => {
    const userId = await assertAuth();
    await dbConnect();

    const now = new Date();
    const year = targetYear || now.getFullYear();
    const month = targetMonth || (now.getMonth() + 1);

    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

    // 1. Fetch user's net historical balance before this month
    const previousTransactions = await TransactionModel.find({
        userId,
        isDeleted: { $ne: true },
        date: { $lt: monthStartStr }
    }).lean();

    let startingBalance = 0;
    previousTransactions.forEach((tx: any) => {
        if (tx.type === 'income') startingBalance += tx.amount;
        else startingBalance -= tx.amount;
    });

    // 2. Fetch current month actual transactions
    const monthTransactions = await TransactionModel.find({
        userId,
        isDeleted: { $ne: true },
        date: { $gte: monthStartStr, $lte: monthEndStr }
    }).sort({ date: 1 }).lean();

    // Group actual transactions by date
    const actualByDate = new Map<string, { income: number; expense: number }>();
    monthTransactions.forEach((tx: any) => {
        const curr = actualByDate.get(tx.date) || { income: 0, expense: 0 };
        if (tx.type === 'income') curr.income += tx.amount;
        else curr.expense += tx.amount;
        actualByDate.set(tx.date, curr);
    });

    // 3. Fetch monthly pending reminders
    const monthlyReminders = await getMonthlyReminders(year, month);
    const pendingReminders = monthlyReminders.filter(r => r.status === 'pending');

    const pendingByDate = new Map<string, { income: number; expense: number }>();
    pendingReminders.forEach((r) => {
        const curr = pendingByDate.get(r.dueDate) || { income: 0, expense: 0 };
        if (r.type === 'income') curr.income += r.amount;
        else curr.expense += r.amount;
        pendingByDate.set(r.dueDate, curr);
    });

    // 4. Build daily series
    const chartPoints: Array<{
        date: string;
        displayDate: string;
        actual: number | null;
        projected: number | null;
        pendingExpenses: number;
        pendingIncome: number;
    }> = [];

    let runningActual = startingBalance;
    const totalDays = monthEnd.getDate();

    // Determine current day limit for actual line
    const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1);
    const lastActualDay = isCurrentMonth
        ? Math.min(now.getDate(), totalDays)
        : (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1) ? totalDays : 0);

    let projectedBalance = runningActual;

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month - 1, day);
        const displayDate = format(dateObj, 'MMM d');

        const actualData = actualByDate.get(dateStr) || { income: 0, expense: 0 };
        const pendingData = pendingByDate.get(dateStr) || { income: 0, expense: 0 };

        // Update actual running balance
        runningActual = runningActual + actualData.income - actualData.expense;

        if (day <= lastActualDay) {
            projectedBalance = runningActual;
            chartPoints.push({
                date: dateStr,
                displayDate,
                actual: runningActual,
                projected: day === lastActualDay ? runningActual : null, // Connect series at today
                pendingExpenses: pendingData.expense,
                pendingIncome: pendingData.income,
            });
        } else {
            // Apply pending reminders to projected balance
            projectedBalance = projectedBalance + pendingData.income - pendingData.expense;
            chartPoints.push({
                date: dateStr,
                displayDate,
                actual: null,
                projected: projectedBalance,
                pendingExpenses: pendingData.expense,
                pendingIncome: pendingData.income,
            });
        }
    }

    const totalPaidExpenses = monthlyReminders
        .filter(r => r.status === 'paid' && r.type === 'expense')
        .reduce((sum, r) => sum + (r.actualAmount || r.amount), 0);

    const totalPendingExpenses = monthlyReminders
        .filter(r => r.status === 'pending' && r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

    const totalPendingIncome = monthlyReminders
        .filter(r => r.status === 'pending' && r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);

    return {
        chartPoints,
        currentBalance: runningActual,
        totalPaidExpenses,
        totalPendingExpenses,
        totalPendingIncome,
        pendingCount: pendingReminders.length,
    };
});
