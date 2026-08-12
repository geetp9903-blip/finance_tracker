'use server';

import { revalidatePath } from 'next/cache';
import { assertAuth } from '@/lib/dal/auth';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';
import { DashboardLayoutSettings } from '@/lib/types';
import { PRESET_LAYOUTS, getDefaultDashboardLayout } from '@/lib/dashboard/widgetRegistry';

export async function saveDashboardLayout(
    layoutSettings: DashboardLayoutSettings
): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const updated = await UserModel.findOneAndUpdate(
            { username: userId },
            { $set: { dashboardLayout: layoutSettings } },
            { new: true }
        );

        if (!updated) {
            return { success: false, message: 'User profile not found.' };
        }

        revalidatePath('/dashboard');
        revalidatePath('/');
        return { success: true, message: 'Dashboard layout saved!' };
    } catch (error) {
        console.error('Failed to save dashboard layout:', error);
        return { success: false, message: 'Failed to save dashboard layout.' };
    }
}

export async function applyPresetLayout(
    presetKey: string
): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await assertAuth();
        await dbConnect();

        const presetObj = PRESET_LAYOUTS[presetKey];
        const layoutToSave = presetObj ? presetObj.settings : getDefaultDashboardLayout();

        await UserModel.findOneAndUpdate(
            { username: userId },
            { $set: { dashboardLayout: layoutToSave } }
        );

        revalidatePath('/dashboard');
        revalidatePath('/');
        return { success: true, message: `Applied ${presetObj ? presetObj.title : 'default'} layout!` };
    } catch (error) {
        console.error('Failed to apply preset layout:', error);
        return { success: false, message: 'Failed to apply preset layout.' };
    }
}
