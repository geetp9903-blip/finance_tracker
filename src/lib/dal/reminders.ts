import 'server-only';
import { cache } from 'react';
import { TransactionReminderModel, ReminderStatusModel, TransactionModel } from '../models';
import { TransactionReminder, MonthlyReminderItem, ReminderStatusState } from '../types';
import dbConnect from '../db';
import { assertAuth } from './auth';
import { startOfMonth, endOfMonth, format, parseISO, differenceInDays } from 'date-fns';

const ensureDb = async () => {
    await dbConnect();
};

/**
 * Get all transaction reminder templates for user (both active and paused).
 */
export const getReminderTemplates = cache(async (): Promise<TransactionReminder[]> => {
    const userId = await assertAuth();
    await ensureDb();

    const templates = await TransactionReminderModel.find({ userId }).lean();

    return templates.map(t => ({
        ...t,
        id: t.id || (t as any)._id?.toString() || '',
        _id: (t as any)._id?.toString(),
        amount: t.amount,
        title: t.title,
        dueDay: t.dueDay || 1,
        category: t.category,
        type: t.type,
        frequency: t.frequency || 'monthly',
        active: t.active !== undefined ? t.active : ((t as any).isActive !== undefined ? (t as any).isActive : true),
    }));
});

/**
 * Get monthly reminder instances with calculated status and 14-day auto-expiration.
 */
export const getMonthlyReminders = cache(async (targetYear?: number, targetMonth?: number): Promise<MonthlyReminderItem[]> => {
    const userId = await assertAuth();
    await ensureDb();

    const now = new Date();
    const year = targetYear || now.getFullYear();
    const month = targetMonth || (now.getMonth() + 1);
    const periodKey = `${year}-${String(month).padStart(2, '0')}`;

    // Filter to only active templates for monthly tracking
    const allTemplates = await getReminderTemplates();
    const templates = allTemplates.filter(t => t.active !== false);

    const statuses = await ReminderStatusModel.find({ userId, periodKey }).lean();
    const statusMap = new Map(statuses.map(s => [s.reminderId, s]));

    const daysInMonth = new Date(year, month, 0).getDate();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result: MonthlyReminderItem[] = [];
    const statusUpdatesToSave: any[] = [];

    for (const t of templates) {
        const reminderId = t.id || (t as any)._id?.toString() || '';
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
    const monthEndStr = format(monthEnd, 'yyyy-MM-dd') + '~'; // ASCII ~ ensures ISO string dates match

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

    // Calculate actual monthly income & expenses
    let totalActualIncome = 0;
    let totalActualExpenses = 0;

    // Group actual transactions by date (normalizing ISO dates to YYYY-MM-DD)
    const actualByDate = new Map<string, { income: number; expense: number }>();
    monthTransactions.forEach((tx: any) => {
        const dateKey = tx.date ? tx.date.substring(0, 10) : '';
        const curr = actualByDate.get(dateKey) || { income: 0, expense: 0 };
        if (tx.type === 'income') {
            curr.income += tx.amount;
            totalActualIncome += tx.amount;
        } else {
            curr.expense += tx.amount;
            totalActualExpenses += tx.amount;
        }
        actualByDate.set(dateKey, curr);
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
        totalActualIncome,
        totalActualExpenses,
        totalPaidExpenses,
        totalPendingExpenses,
        totalPendingIncome,
        totalIncome: totalActualIncome + totalPendingIncome,
        pendingCount: pendingReminders.length,
    };
});
