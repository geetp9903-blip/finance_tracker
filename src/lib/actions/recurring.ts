'use server';

import { revalidatePath } from 'next/cache';
import { RecurringRuleModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { assertAuth } from '@/lib/dal/auth';
import { RecurringRuleSchema } from '@/lib/schemas';
import crypto from 'crypto';
import { z } from 'zod';

// Input schema for creating a rule (omit system fields)
const CreateRuleInput = RecurringRuleSchema.omit({
    id: true,
    userId: true,
    nextDueDate: true, // We calculate this
    active: true, // Default true
    lastProcessed: true
});

export async function createRule(formData: FormData) {
    const userId = await assertAuth();
    await dbConnect();

    const rawData = {
        type: formData.get('type'),
        category: formData.get('category'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount') as string),
        frequency: formData.get('frequency'),
        startDate: formData.get('startDate'), // ISO Date string
    };

    try {
        const validated = CreateRuleInput.parse(rawData);

        // Next due date starts as the start date
        const nextDueDate = validated.startDate;

        await RecurringRuleModel.create({
            id: crypto.randomUUID(),
            userId,
            ...validated,
            nextDueDate,
            active: true
        });

        revalidatePath('/dashboard/recurring');
        return { success: true };
    } catch (error) {
        console.error('Create Rule Error:', error);
        return { error: 'Failed to create rule.' };
    }
}

export async function toggleRule(ruleId: string, active: boolean) {
    const userId = await assertAuth();
    await dbConnect();

    try {
        await RecurringRuleModel.updateOne(
            { id: ruleId, userId },
            { $set: { active } }
        );
        revalidatePath('/dashboard/recurring');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to update rule.' };
    }
}

export async function deleteRule(ruleId: string) {
    const userId = await assertAuth();
    await dbConnect();

    try {
        await RecurringRuleModel.deleteOne({ id: ruleId, userId });
        revalidatePath('/dashboard/recurring');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete rule.' };
    }
}

export async function triggerInternalCron() {
    await assertAuth(); // Admin check could go here, for now just auth

    try {
        // We call the API route internally via fetch, assuming localhost
        // In production, better to invoke the logic function directly if possible
        // but calling the route simulates the real event.
        const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${url}/api/cron/recurring?key=${process.env.CRON_SECRET}`, {
            method: 'GET'
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Cron Trigger Error", error);
        return { error: "Failed to trigger cron." };
    }
}
