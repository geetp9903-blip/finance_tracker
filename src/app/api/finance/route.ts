import { NextResponse } from 'next/server';
import { getTransactions, createTransaction, deleteTransaction, getBudget, updateUserBudget } from '@/lib/storage';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const allTransactions = await getTransactions();
        const transactions = allTransactions.filter(t => t.userId === userId);

        const allBudgets = await getBudget();
        const budget = allBudgets[userId] || { fixedExpenses: [], allocations: [] };

        return NextResponse.json({ transactions, budget });
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

            // Return updated list
            const transactions = await getTransactions(userId);
            return NextResponse.json({ success: true, transactions });
        }

        if (type === 'budget') {
            console.log('[Finance API] Updating budget...');
            await updateUserBudget(userId, data);
            console.log('[Finance API] Budget saved');
            return NextResponse.json({ success: true, budget: data });
        }

        if (type === 'delete_transaction') {
            console.log('[Finance API] Deleting transaction:', data.id);
            await deleteTransaction(data.id, userId);
            console.log('[Finance API] Transaction deleted');

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
