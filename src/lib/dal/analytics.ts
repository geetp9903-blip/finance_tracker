import 'server-only';
import { cache } from 'react';
import { TransactionModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { assertAuth } from './auth';

// Types for Analytics Data
export type DailySpend = {
    _id: string; // Date string "YYYY-MM-DD"
    amount: number;
    count: number;
};

export type CategorySpend = {
    _id: string; // Category Name
    total: number;
    count: number;
};

/**
 * Get daily spending trend for a date range.
 * Uses MongoDB Aggregation for performance.
 */
export const getDailySpending = cache(async (
    startDate: Date,
    endDate: Date,
    timezone: string = 'UTC'
): Promise<DailySpend[]> => {
    const userId = await assertAuth();
    await dbConnect();

    const pipeline = [
        {
            $match: {
                userId: userId,
                type: 'expense',
                date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
            }
        },
        {
            $project: {
                amount: 1,
                // Convert ISO date to "YYYY-MM-DD" in User's Timezone
                dateString: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: { $toDate: "$date" }, // Ensure it's treated as date
                        timezone: timezone
                    }
                }
            }
        },
        {
            $group: {
                _id: "$dateString",
                amount: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 as const } } // Sort by date ascending
    ];

    const results = await TransactionModel.aggregate(pipeline);
    return results as DailySpend[];
});

/**
 * Get spending breakdown by category.
 */
export const getCategoryBreakdown = cache(async (
    startDate: Date,
    endDate: Date
): Promise<CategorySpend[]> => {
    const userId = await assertAuth();
    await dbConnect();

    const pipeline = [
        {
            $match: {
                userId: userId,
                type: 'expense',
                date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
            }
        },
        {
            $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { total: -1 as const } } // Highest spend first
    ];

    const results = await TransactionModel.aggregate(pipeline);
    return results as CategorySpend[];
});

/**
 * Get Income trend (similar to daily spending but for income)
 */
export const getIncomeTrend = cache(async (
    startDate: Date,
    endDate: Date,
    timezone: string = 'UTC'
): Promise<DailySpend[]> => {
    const userId = await assertAuth();
    await dbConnect();

    const pipeline = [
        {
            $match: {
                userId: userId,
                type: 'income',
                date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
            }
        },
        {
            $project: {
                amount: 1,
                dateString: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: { $toDate: "$date" },
                        timezone: timezone
                    }
                }
            }
        },
        {
            $group: {
                _id: "$dateString",
                amount: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 as const } }
    ];

    const results = await TransactionModel.aggregate(pipeline);
    return results as DailySpend[];
});

export type ChartDataPoint = {
    label: string;
    value: number;
    count: number;
};

export const getSpendingChartData = cache(async (
    year: number,
    month?: number,
    category?: string,
    timezone: string = 'UTC'
): Promise<ChartDataPoint[]> => {
    const userId = await assertAuth();
    await dbConnect();

    let startDate: Date, endDate: Date;
    let formatString: string;

    if (month) {
        startDate = new Date(Date.UTC(year, month - 1, 1));
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
        formatString = "%d";
    } else {
        startDate = new Date(Date.UTC(year, 0, 1));
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
        formatString = "%m";
    }

    const matchQuery: any = {
        userId: userId,
        type: 'expense',
        date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
    };

    if (category && category !== 'All') {
        matchQuery.category = category;
    }

    const pipeline = [
        { $match: matchQuery },
        {
            $project: {
                amount: 1,
                dateKey: {
                    $dateToString: {
                        format: formatString,
                        date: { $toDate: "$date" },
                        timezone: timezone
                    }
                }
            }
        },
        {
            $group: {
                _id: "$dateKey",
                value: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 as const } }
    ];

    const results = await TransactionModel.aggregate(pipeline);

    return results.map(r => {
        let label = r._id;
        if (!month) {
            const date = new Date(2000, parseInt(r._id) - 1, 1);
            label = date.toLocaleString('default', { month: 'short' });
        }
        return {
            label,
            value: r.value,
            count: r.count
        };
    });
});

export const getTopCategories = cache(async (
    year: number,
    month?: number
): Promise<{ category: string; value: number }[]> => {
    const userId = await assertAuth();
    await dbConnect();

    let startDate: Date, endDate: Date;

    if (month) {
        startDate = new Date(Date.UTC(year, month - 1, 1));
        endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    } else {
        startDate = new Date(Date.UTC(year, 0, 1));
        endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    }

    const pipeline = [
        {
            $match: {
                userId: userId,
                type: 'expense',
                date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
            }
        },
        {
            $group: {
                _id: "$category",
                value: { $sum: "$amount" }
            }
        },
        { $sort: { value: -1 as const } },
        { $limit: 10 }
    ];

    const results = await TransactionModel.aggregate(pipeline);

    return results.map(r => ({
        category: r._id,
        value: r.value
    }));
});

export type CategoryTrend = {
    date: string;
    category: string;
    amount: number;
};

export const getCategoryTrends = cache(async (
    startDate: Date,
    endDate: Date,
    timezone: string = 'UTC'
): Promise<CategoryTrend[]> => {
    const userId = await assertAuth();
    await dbConnect();

    const pipeline = [
        {
            $match: {
                userId: userId,
                type: 'expense',
                date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
            }
        },
        {
            $project: {
                amount: 1,
                category: 1,
                dateString: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: { $toDate: "$date" },
                        timezone: timezone
                    }
                }
            }
        },
        {
            $group: {
                _id: { date: "$dateString", category: "$category" },
                amount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.date": 1 as const } }
    ];

    const results = await TransactionModel.aggregate(pipeline);

    return results.map(r => ({
        date: r._id.date,
        category: r._id.category,
        amount: r.amount
    }));
});
