'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAuth } from '@/lib/dal/auth';
import { CreateTransactionSchema, IdSchema } from '@/lib/schemas';
import { TransactionModel, BudgetModel, RecurringRuleModel } from '@/lib/models';
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
            date: new Date().toISOString(), // Use server time or form time
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
            userId: userId
        });

        revalidatePath('/dashboard');
        return { message: 'Transaction added successfully', success: true };

    } catch (error) {
        console.error('Failed to add transaction:', error);
        return { message: 'Database Error: Failed to create transaction.' };
    }
}

export async function deleteTransaction(
    id: string
): Promise<ActionState> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        // Validate ID format
        const idCheck = IdSchema.safeParse(id);
        if (!idCheck.success) {
            return { message: 'Invalid ID format' };
        }

        const result = await TransactionModel.deleteOne({ id, userId });

        if (result.deletedCount === 0) {
            return { message: 'Transaction not found or unauthorized' };
        }

        revalidatePath('/dashboard');
        return { message: 'Transaction deleted successfully', success: true };

    } catch (error) {
        console.error('Failed to delete transaction:', error);
        return { message: 'Database Error: Failed to delete transaction.' };
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
            { id, userId },
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
