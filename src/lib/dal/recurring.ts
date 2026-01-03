import 'server-only';
import { cache } from 'react';
import { RecurringRuleModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { assertAuth } from './auth';
import { RecurringRule } from '@/lib/types';

/**
 * Fetch all recurring rules for the current user.
 * Sorted by nextDueDate ascending (soonest first).
 */
export const getRecurringRules = cache(async (): Promise<RecurringRule[]> => {
    const userId = await assertAuth();
    await dbConnect();

    // Use .find() and map to plain objects to avoid Mongoose hydration issues in RSC
    const rules = await RecurringRuleModel.find({ userId })
        .sort({ nextDueDate: 1 })
        .lean();

    return rules.map((r: any) => ({
        ...r,
        id: r.id || r._id.toString(),
        _id: undefined
    })) as RecurringRule[];
});
