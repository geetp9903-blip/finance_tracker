import { Transaction, MonthlyReminderItem, Budget } from "@/lib/types";

export interface SanitizedFinancialPayload {
    currency: string;
    currentBalance: number;
    currentPeriod: {
        year: number;
        month: number;
        daysInMonth: number;
        currentDay: number;
        totalIncome: number;
        totalExpense: number;
        netSavings: number;
        categories: Array<{
            category: string;
            totalAmount: number;
            percentageOfExpenses: number;
            transactionCount: number;
        }>;
    };
    previousPeriod?: {
        totalExpense: number;
        categories: Array<{
            category: string;
            totalAmount: number;
        }>;
    };
    upcomingReminders: Array<{
        title: string;
        amount: number;
        category: string;
        dueDate: string;
        daysUntilDue: number;
        status: string;
    }>;
    budgetConfiguration?: {
        fixedExpensesTotal: number;
        allocations: Array<{
            name: string;
            percentage: number;
            cap?: number;
        }>;
    };
    recurringSubscriptions: Array<{
        category: string;
        estimatedMonthlyAmount: number;
        count: number;
    }>;
}

/**
 * Strips PII and creates an aggregated numerical summary for the Gemini AI model.
 * Zero user emails, usernames, PINs, or raw bank details are included.
 */
export function sanitizeAndAggregateFinancialData(params: {
    currentTransactions: Transaction[];
    previousTransactions?: Transaction[];
    reminders: MonthlyReminderItem[];
    budget?: Budget | null;
    currency?: string;
    currentBalance?: number;
}): SanitizedFinancialPayload {
    const {
        currentTransactions,
        previousTransactions = [],
        reminders,
        budget,
        currency = 'INR',
        currentBalance = 0
    } = params;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 1. Current Period Aggregations
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { amount: number; count: number }> = {};

    for (const txn of currentTransactions) {
        if (txn.isDeleted) continue;
        if (txn.type === 'income') {
            totalIncome += txn.amount;
        } else if (txn.type === 'expense') {
            totalExpense += txn.amount;
            const cat = txn.category || 'Other';
            if (!categoryTotals[cat]) {
                categoryTotals[cat] = { amount: 0, count: 0 };
            }
            categoryTotals[cat].amount += txn.amount;
            categoryTotals[cat].count += 1;
        }
    }

    const currentCategories = Object.entries(categoryTotals)
        .map(([category, data]) => ({
            category,
            totalAmount: Math.round(data.amount),
            percentageOfExpenses: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
            transactionCount: data.count
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

    // 2. Previous Period Aggregations
    let prevTotalExpense = 0;
    const prevCategoryTotals: Record<string, number> = {};

    for (const txn of previousTransactions) {
        if (txn.isDeleted) continue;
        if (txn.type === 'expense') {
            prevTotalExpense += txn.amount;
            const cat = txn.category || 'Other';
            prevCategoryTotals[cat] = (prevCategoryTotals[cat] || 0) + txn.amount;
        }
    }

    const prevCategories = Object.entries(prevCategoryTotals).map(([category, amount]) => ({
        category,
        totalAmount: Math.round(amount)
    }));

    // 3. Upcoming Reminders Analysis (Pending or due soon)
    const upcomingReminders = reminders
        .filter(r => r.status === 'pending')
        .map(r => {
            const due = new Date(r.dueDate);
            const diffTime = due.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                title: r.title.replace(/[0-9]{4,}/g, '****'), // Mask any numeric account numbers if in title
                amount: r.amount,
                category: r.category,
                dueDate: r.dueDate,
                daysUntilDue,
                status: r.status
            };
        })
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // 4. Budget Configurations
    let budgetConfiguration;
    if (budget) {
        const fixedExpensesTotal = (budget.fixedExpenses || []).reduce((sum, f) => sum + (f.amount || 0), 0);
        const allocations = (budget.allocations || []).map(a => ({
            name: a.name,
            percentage: a.percentage,
            cap: a.cap
        }));
        budgetConfiguration = {
            fixedExpensesTotal,
            allocations
        };
    }

    // 5. Subscription / Recurring Creep
    // Group reminders or recurring items by category
    const subTotals: Record<string, { amount: number; count: number }> = {};
    for (const r of reminders) {
        const cat = r.category || 'Subscription';
        if (!subTotals[cat]) subTotals[cat] = { amount: 0, count: 0 };
        subTotals[cat].amount += r.amount;
        subTotals[cat].count += 1;
    }
    const recurringSubscriptions = Object.entries(subTotals).map(([category, data]) => ({
        category,
        estimatedMonthlyAmount: Math.round(data.amount),
        count: data.count
    }));

    return {
        currency,
        currentBalance,
        currentPeriod: {
            year: currentYear,
            month: currentMonth,
            daysInMonth,
            currentDay,
            totalIncome,
            totalExpense,
            netSavings: totalIncome - totalExpense,
            categories: currentCategories
        },
        previousPeriod: {
            totalExpense: prevTotalExpense,
            categories: prevCategories
        },
        upcomingReminders,
        budgetConfiguration,
        recurringSubscriptions
    };
}
