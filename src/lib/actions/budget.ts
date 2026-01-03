'use server';

import { revalidatePath } from 'next/cache';
import { BudgetModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { assertAuth } from '@/lib/dal/auth';
import { z } from 'zod';

const UpdateLimitSchema = z.object({
    allocationId: z.string(),
    cap: z.number().positive()
});

export async function updateCategoryLimit(allocationId: string, cap: number) {
    const userId = await assertAuth();
    await dbConnect();

    try {
        const validated = UpdateLimitSchema.parse({ allocationId, cap });

        // Find the user's budget and update the specific allocation's cap
        // We use array filters to target the sub-document
        const result = await BudgetModel.updateOne(
            { userId, "allocations.id": validated.allocationId },
            {
                $set: { "allocations.$.cap": validated.cap }
            }
        );

        if (result.matchedCount === 0) {
            // Edge case: Budget doesn't exist or Allocation ID is wrong
            // For this refactor, we assume the initial budget is seeded or created elsewhere
            return { error: "Budget category not found." };
        }

        revalidatePath('/dashboard/budget');
        return { success: true };
    } catch (error) {
        console.error('Failed to update budget limit:', error);
        return { error: "Failed to update limit." };
    }
}
