'use server';

import { UserModel } from '@/lib/models';
import { assertAuth } from '@/lib/dal/auth';
import dbConnect from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateCurrency(currencyCode: string) {
    const userId = await assertAuth();
    await dbConnect();

    await UserModel.findOneAndUpdate(
        { username: userId },
        { currency: currencyCode }
    );

    revalidatePath('/dashboard');
    revalidatePath('/settings');
    revalidatePath('/transactions');
    revalidatePath('/budget');
}
