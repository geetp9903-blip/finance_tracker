'use server';

import { revalidatePath } from 'next/cache';
import { assertAuth } from '@/lib/dal/auth';
import { CreateTransactionSchema, IdSchema } from '@/lib/schemas';
import { TransactionModel, ReminderStatusModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { randomUUID } from 'crypto';

export type ActionState = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
};

export async function addTransaction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const rawData = {
            amount: Number(formData.get('amount')),
            description: formData.get('description'),
            category: formData.get('category'),
            type: formData.get('type'),
            date: formData.get('date') || new Date().toISOString(),
        };

        const validated = CreateTransactionSchema.safeParse(rawData);

        if (!validated.success) {
            return {
                message: 'Invalid fields',
                errors: validated.error.flatten().fieldErrors
            };
        }

        const newId = randomUUID();

        await TransactionModel.create({
            ...validated.data,
            id: newId,
            userId: userId,
            isDeleted: false,
        });

        revalidatePath('/dashboard');
        revalidatePath('/transactions');
        revalidatePath('/analytics');
        return { message: 'Transaction added successfully', success: true };

    } catch (error) {
        console.error('Failed to add transaction:', error);
        return { message: 'Database Error: Failed to create transaction.' };
    }
}

/**
 * Soft deletes a single transaction.
 * If linked to a reminder, sets monthly instance status to skipped.
 */
export async function deleteTransaction(
    id: string
): Promise<ActionState> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const idCheck = IdSchema.safeParse(id);
        if (!idCheck.success) {
            return { message: 'Invalid ID format' };
        }

        const now = new Date().toISOString();
        const tx = await TransactionModel.findOneAndUpdate(
            { id, userId, isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: now } }
        ).lean();

        if (!tx) {
            return { message: 'Transaction not found or already deleted' };
        }

        // If linked to a monthly reminder, update monthly instance status to skipped
        if (tx.reminderId && tx.date) {
            const periodKey = tx.date.substring(0, 7);
            await ReminderStatusModel.updateOne(
                { reminderId: tx.reminderId, userId, periodKey },
                { $set: { status: 'skipped' } }
            );
        }

        revalidatePath('/dashboard');
        revalidatePath('/transactions');
        revalidatePath('/analytics');
        revalidatePath('/reminders');
        return { message: 'Transaction soft-deleted successfully', success: true };

    } catch (error) {
        console.error('Failed to delete transaction:', error);
        return { message: 'Database Error: Failed to delete transaction.' };
    }
}

/**
 * Bulk soft-delete selected transaction IDs.
 */
export async function bulkDeleteTransactions(
    ids: string[]
): Promise<{ success: boolean; message: string; deletedCount: number }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        if (!ids || ids.length === 0) {
            return { success: false, message: 'No transactions selected.', deletedCount: 0 };
        }

        const now = new Date().toISOString();

        // 1. Fetch matching transactions to check for linked reminders
        const txList = await TransactionModel.find({
            id: { $in: ids },
            userId,
            isDeleted: { $ne: true }
        }).lean();

        if (txList.length === 0) {
            return { success: false, message: 'No active transactions matched.', deletedCount: 0 };
        }

        // 2. Soft delete matching transactions
        const result = await TransactionModel.updateMany(
            { id: { $in: ids }, userId },
            { $set: { isDeleted: true, deletedAt: now } }
        );

        // 3. Revert monthly reminder instances for linked transactions
        for (const tx of txList) {
            if (tx.reminderId && tx.date) {
                const periodKey = tx.date.substring(0, 7);
                await ReminderStatusModel.updateOne(
                    { reminderId: tx.reminderId, userId, periodKey },
                    { $set: { status: 'skipped' } }
                );
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/transactions');
        revalidatePath('/analytics');
        revalidatePath('/reminders');

        return {
            success: true,
            message: `Soft-deleted ${result.modifiedCount} transactions!`,
            deletedCount: result.modifiedCount
        };
    } catch (error) {
        console.error('Failed to bulk delete transactions:', error);
        return { success: false, message: 'Failed to bulk delete transactions.', deletedCount: 0 };
    }
}

/**
 * Flush transactions matching specific criteria (soft delete).
 */
export async function flushTransactionsByCriteria(criteria: {
    beforeDate?: string;
    category?: string;
    type?: 'income' | 'expense' | 'all';
    year?: number;
    month?: number;
    keyword?: string;
    minAmount?: number;
    maxAmount?: number;
    flushAll?: boolean;
}): Promise<{ success: boolean; message: string; count: number }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const query: any = { userId };

        if (!criteria.flushAll) {
            query.isDeleted = { $ne: true };

            if (criteria.beforeDate) {
                const endDateStr = criteria.beforeDate.includes('T') ? criteria.beforeDate : `${criteria.beforeDate}T23:59:59.999Z`;
                query.date = { $lte: endDateStr };
            }

            if (criteria.category && criteria.category !== 'all') {
                query.category = criteria.category;
            }

            if (criteria.type && criteria.type !== 'all') {
                query.type = criteria.type;
            }

            if (criteria.year) {
                if (criteria.month) {
                    const startStr = `${criteria.year}-${String(criteria.month).padStart(2, '0')}-01`;
                    const daysInMonth = new Date(criteria.year, criteria.month, 0).getDate();
                    const endStr = `${criteria.year}-${String(criteria.month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}T23:59:59`;
                    query.date = { $gte: startStr, $lte: endStr };
                } else {
                    query.date = { $regex: `^${criteria.year}` };
                }
            }

            if (criteria.keyword && criteria.keyword.trim() !== '') {
                query.description = { $regex: criteria.keyword.trim(), $options: 'i' };
            }

            if (criteria.minAmount !== undefined || criteria.maxAmount !== undefined) {
                query.amount = {};
                if (criteria.minAmount !== undefined) query.amount.$gte = criteria.minAmount;
                if (criteria.maxAmount !== undefined) query.amount.$lte = criteria.maxAmount;
            }
        } else {
            // For flushAll: match all active transactions for this user
            query.isDeleted = { $ne: true };
        }

        const now = new Date().toISOString();

        // Fetch matched list to check for linked reminder instances
        const matched = await TransactionModel.find(query).lean();
        if (matched.length === 0) {
            return { success: false, message: 'No active transactions matched the specified criteria.', count: 0 };
        }

        // Soft delete
        const result = await TransactionModel.updateMany(
            query,
            { $set: { isDeleted: true, deletedAt: now } }
        );

        // Update monthly reminder statuses for linked items
        for (const tx of matched) {
            if (tx.reminderId && tx.date) {
                const periodKey = tx.date.substring(0, 7);
                await ReminderStatusModel.updateOne(
                    { reminderId: tx.reminderId, userId, periodKey },
                    { $set: { status: 'skipped' } }
                );
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/transactions');
        revalidatePath('/analytics');
        revalidatePath('/reminders');

        return {
            success: true,
            message: `Successfully flushed ${result.modifiedCount} transactions!`,
            count: result.modifiedCount
        };
    } catch (error) {
        console.error('Failed to flush transactions by criteria:', error);
        return { success: false, message: 'Failed to flush transactions.', count: 0 };
    }
}

export async function updateTransaction(
    id: string,
    formData: {
        amount: number;
        description: string;
        category: string;
        type: 'income' | 'expense';
        date: string;
    }
) {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const result = await TransactionModel.findOneAndUpdate(
            { id, userId, isDeleted: { $ne: true } },
            {
                $set: {
                    amount: formData.amount,
                    description: formData.description,
                    category: formData.category,
                    type: formData.type,
                    date: formData.date
                }
            }
        );

        if (!result) return { success: false, message: 'Transaction not found or unauthorized' };

        revalidatePath('/dashboard');
        revalidatePath('/transactions');
        revalidatePath('/analytics');

        return { success: true };
    } catch (error) {
        return { success: false, message: 'Server Error' };
    }
}
