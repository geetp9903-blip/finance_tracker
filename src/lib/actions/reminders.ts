'use server';

import { revalidatePath } from 'next/cache';
import { assertAuth } from '@/lib/dal/auth';
import { TransactionReminderModel, ReminderStatusModel, TransactionModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';

export type ActionState = {
    message: string;
    errors?: Record<string, string[]>;
    success?: boolean;
};

export async function createReminderTemplate(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const title = formData.get('title') as string;
        const amount = Number(formData.get('amount'));
        const type = (formData.get('type') as 'income' | 'expense') || 'expense';
        const category = formData.get('category') as string;
        const dueDay = Number(formData.get('dueDay')) || 1;
        const frequency = (formData.get('frequency') as string) || 'monthly';

        if (!title || isNaN(amount) || amount <= 0 || !category) {
            return { message: 'Please fill out all required fields with valid values.' };
        }

        const id = `rem_${randomUUID()}`;

        await TransactionReminderModel.create({
            id,
            userId,
            title,
            amount,
            type,
            category,
            dueDay: Math.min(Math.max(dueDay, 1), 31),
            frequency,
            active: true,
            startDate: new Date().toISOString(),
        });

        revalidatePath('/dashboard');
        revalidatePath('/reminders');
        revalidatePath('/recurring');
        return { message: 'Reminder created successfully', success: true };
    } catch (error) {
        console.error('Failed to create reminder template:', error);
        return { message: 'Failed to create reminder template.' };
    }
}

export async function updateReminderTemplate(
    id: string,
    data: {
        title: string;
        amount: number;
        type: 'income' | 'expense';
        category: string;
        dueDay: number;
        active?: boolean;
    }
): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const updated = await TransactionReminderModel.findOneAndUpdate(
            { id, userId },
            {
                $set: {
                    title: data.title,
                    amount: data.amount,
                    type: data.type,
                    category: data.category,
                    dueDay: Math.min(Math.max(data.dueDay, 1), 31),
                    active: data.active !== undefined ? data.active : true,
                }
            }
        );

        if (!updated) return { success: false, message: 'Reminder template not found.' };

        revalidatePath('/dashboard');
        revalidatePath('/reminders');
        revalidatePath('/recurring');
        return { success: true, message: 'Reminder updated successfully' };
    } catch (error) {
        console.error('Failed to update reminder template:', error);
        return { success: false, message: 'Failed to update reminder template.' };
    }
}

export async function deleteReminderTemplate(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        await TransactionReminderModel.deleteOne({ id, userId });
        await ReminderStatusModel.deleteMany({ reminderId: id, userId });

        revalidatePath('/dashboard');
        revalidatePath('/reminders');
        revalidatePath('/recurring');
        return { success: true, message: 'Reminder deleted successfully' };
    } catch (error) {
        console.error('Failed to delete reminder template:', error);
        return { success: false, message: 'Failed to delete reminder template.' };
    }
}

/**
 * Mark a monthly reminder as paid.
 * Spawns an actual Transaction record and updates the ReminderStatus for the current periodKey.
 */
export async function markReminderPaid(
    reminderId: string,
    periodKey: string,
    actualAmount?: number,
    paidDate?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const template = await TransactionReminderModel.findOne({ id: reminderId, userId }).lean();
        if (!template) {
            return { success: false, message: 'Reminder template not found.' };
        }

        const dateToUse = paidDate || format(new Date(), 'yyyy-MM-dd');
        const finalAmount = actualAmount !== undefined ? actualAmount : template.amount;
        const transactionId = `tx_rem_${randomUUID()}`;

        // 1. Create actual transaction
        await TransactionModel.create({
            id: transactionId,
            userId,
            amount: finalAmount,
            type: template.type,
            category: template.category,
            description: template.title,
            date: dateToUse,
            reminderId,
        });

        // 2. Upsert reminder status for this period
        await ReminderStatusModel.updateOne(
            { reminderId, userId, periodKey },
            {
                $set: {
                    id: `stat_${reminderId}_${periodKey}`,
                    reminderId,
                    userId,
                    periodKey,
                    status: 'paid',
                    paidTransactionId: transactionId,
                    actualAmount: finalAmount,
                    paidDate: dateToUse,
                }
            },
            { upsert: true }
        );

        revalidatePath('/dashboard');
        revalidatePath('/reminders');
        revalidatePath('/recurring');
        revalidatePath('/transactions');
        revalidatePath('/analytics');

        return { success: true, message: 'Marked as paid and logged transaction!' };
    } catch (error) {
        console.error('Failed to mark reminder paid:', error);
        return { success: false, message: 'Failed to mark reminder as paid.' };
    }
}

/**
 * Skip a monthly reminder for the given periodKey.
 */
export async function skipReminder(
    reminderId: string,
    periodKey: string
): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        await ReminderStatusModel.updateOne(
            { reminderId, userId, periodKey },
            {
                $set: {
                    id: `stat_${reminderId}_${periodKey}`,
                    reminderId,
                    userId,
                    periodKey,
                    status: 'skipped',
                }
            },
            { upsert: true }
        );

        revalidatePath('/dashboard');
        revalidatePath('/reminders');
        revalidatePath('/recurring');

        return { success: true, message: 'Reminder skipped for this period.' };
    } catch (error) {
        console.error('Failed to skip reminder:', error);
        return { success: false, message: 'Failed to skip reminder.' };
    }
}
