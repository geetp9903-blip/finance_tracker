import { NextResponse } from 'next/server';
import { getTransactions, createTransaction, deleteTransaction, updateTransaction, getBudget, updateUserBudget, getRecurringRules } from '@/lib/storage';
import { cacheService } from '@/lib/cache';

import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        // Add dbConnect if it's a global utility, otherwise it needs to be imported.
        // Assuming dbConnect() is available or will be added elsewhere.
        // For now, I'll add it as requested.
        // await dbConnect(); // This function is not defined in the provided context.

        // 1. Auth Check - using next/headers
        const cookieStore = await cookies();
        const token = cookieStore.get('sessionToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const cacheKey = `finance_data_${userId}`;
        const cachedData = cacheService.get(cacheKey);

        if (cachedData) {
            return NextResponse.json(cachedData);
        }

        const allTransactions = await getTransactions();
        const transactions = allTransactions.filter(t => t.userId === userId);

        const budgetData = await getBudget(userId);
        const budget = budgetData[userId] || { fixedExpenses: [], allocations: [], entries: [] };

        const recurringRules = await getRecurringRules(userId);

        const responseData = { transactions, budget, recurringRules };
        cacheService.set(cacheKey, responseData);

        return NextResponse.json(responseData);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        console.log('[Finance API] POST request received. User:', userId);

        if (!userId) {
            console.error('[Finance API] User ID missing');
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { type, data } = body;
        console.log('[Finance API] Request type:', type);

        if (type === 'transaction') {
            console.log('[Finance API] Adding transaction...');
            const newTransaction = { ...data, userId };
            // Use granular create instead of fetch-all-then-save-all
            await createTransaction(newTransaction);
            console.log('[Finance API] Transaction created');

            // Invalidate cache
            cacheService.invalidate(`finance_data_${userId}`);

            // Return updated list
            const transactions = await getTransactions(userId);

            return NextResponse.json({ success: true, transactions });
        }

        if (type === 'edit_transaction') {
            console.log('[Finance API] Editing transaction:', data.id);
            await updateTransaction(data.id, data.updates, userId);

            // Invalidate cache
            cacheService.invalidate(`finance_data_${userId}`);

            // Return updated list
            const transactions = await getTransactions(userId);
            return NextResponse.json({ success: true, transactions });
        }

        if (type === 'budget') {
            console.log('[Finance API] Updating budget...');
            await updateUserBudget(userId, data);
            console.log('[Finance API] Budget saved');

            // Invalidate cache
            cacheService.invalidate(`finance_data_${userId}`);

            return NextResponse.json({ success: true, budget: data });
        }

        if (type === 'delete_transaction') {
            console.log('[Finance API] Deleting transaction:', data.id);
            await deleteTransaction(data.id, userId);
            console.log('[Finance API] Transaction deleted');

            // Invalidate cache
            cacheService.invalidate(`finance_data_${userId}`);

            // Return updated list
            const transactions = await getTransactions(userId);
            return NextResponse.json({ success: true, transactions });
        }

        console.warn('[Finance API] Invalid type:', type);
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        console.error('[Finance API] Error:', error);
        // Return explicit error message to help debugging
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
