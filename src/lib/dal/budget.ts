import 'server-only';
import { cache } from 'react';
import { BudgetModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { assertAuth } from './auth';

export const getBudget = cache(async () => {
    const userId = await assertAuth();
    await dbConnect();

    const budget = await BudgetModel.findOne({ userId }).lean();

    if (budget) {
        // Convert _id to string if needed, removing Mongoose specific fields
        const allocations = budget.allocations.map((a: any) => ({
            ...a,
            id: a.id || a._id.toString(),
            _id: undefined
        }));
        return { ...budget, allocations };
    }

    return null;
});
