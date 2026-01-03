import 'server-only';
import { cache } from 'react';
import { TransactionModel, BudgetModel, RecurringRuleModel } from '../models';

import dbConnect from '../db';
import { assertAuth } from './auth';

// Helper to ensure connection
const ensureDb = async () => {
    await dbConnect();
};

export type TransactionFilterOptions = {
    page?: number;
    limit?: number;
    query?: string;
    type?: 'income' | 'expense' | 'all';
    startDate?: Date | null;
    endDate?: Date | null;
    sort?: 'date' | 'amount';
    sortDirection?: 'asc' | 'desc';
};

export type PaginatedTransactions = {
    data: any[]; // Typed in return
    metadata: {
        total: number;
        page: number;
        totalPages: number;
        hasMore: boolean;
    };
};

export const getTransactions = cache(async (options: number | TransactionFilterOptions = {}): Promise<PaginatedTransactions> => {
    const userId = await assertAuth();
    await ensureDb();

    // Backward compatibility for simple "limit" calls (e.g. from Dashboard)
    const opts: TransactionFilterOptions = typeof options === 'number'
        ? { limit: options, page: 1 }
        : { page: 1, limit: 50, sort: 'date', sortDirection: 'desc', ...options };

    const {
        page = 1,
        limit = 50,
        query,
        type,
        startDate,
        endDate,
        sort = 'date',
        sortDirection = 'desc'
    } = opts;

    const skip = (page - 1) * limit;

    // Build Query
    const mongoQuery: any = { userId };

    if (type && type !== 'all') {
        mongoQuery.type = type;
    }

    if (startDate || endDate) {
        mongoQuery.date = {};
        if (startDate) mongoQuery.date.$gte = startDate.toISOString();
        if (endDate) mongoQuery.date.$lte = endDate.toISOString();
    }

    if (query) {
        // Case-insensitive regex search on description or category
        mongoQuery.$or = [
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
        ];
    }

    // Execute Query
    const [transactions, total] = await Promise.all([
        TransactionModel.find(mongoQuery)
            .sort({ [sort]: sortDirection === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        TransactionModel.countDocuments(mongoQuery)
    ]);

    const mappedData = transactions.map(t => ({
        ...t,
        id: t.id.toString(),
        _id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        date: t.date
    }));

    return {
        data: mappedData,
        metadata: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        }
    };
});

export const getBudget = cache(async () => {
    const userId = await assertAuth();
    await ensureDb();

    // Find one or create default? 
    // Logic: BudgetModel stores per user.
    const budget = await BudgetModel.findOne({ userId }).lean();

    if (!budget) return null;

    return {
        ...budget,
        _id: budget._id.toString(),
        // Map implementation details if deep arrays have ObjectIds
    };
});

export const getRecurringRules = cache(async () => {
    const userId = await assertAuth();
    await ensureDb();

    const rules = await RecurringRuleModel.find({ userId }).lean();

    return rules.map(r => ({
        ...r,
        id: r.id.toString(),
        _id: r._id.toString()
    }));
});

// Heavy Analytics Aggregation - Candidate for "use cache" in future
export const getFinancialSummary = cache(async (startDate: Date, endDate: Date) => {
    const userId = await assertAuth();
    await ensureDb();

    const transactions = await TransactionModel.find({
        userId,
        date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
    }).lean();

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        income,
        expense,
        balance: income - expense,
        transactionCount: transactions.length
    };
});

export const getCalendarData = cache(async (year: number, month: number) => {
    const userId = await assertAuth();
    await ensureDb();

    // specific month range
    // Note: Month is 0-indexed in JS Date? No, usually passed as 1-12 from UI, let's assume 1-based input
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await TransactionModel.find({
        userId,
        date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
    }).select('date type amount category').lean();

    return transactions.map(t => ({
        id: t._id.toString(),
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.category
    }));
});
