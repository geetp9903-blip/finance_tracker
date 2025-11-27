import { NextResponse } from 'next/server';
import { getTransactions, saveTransactions, getBudget, saveBudget } from '@/lib/storage';

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
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { type, data } = await request.json();

        if (type === 'transaction') {
            const transactions = await getTransactions();
            const newTransaction = { ...data, userId };
            transactions.push(newTransaction);
            await saveTransactions(transactions);
            // Return only user's transactions
            return NextResponse.json({ success: true, transactions: transactions.filter(t => t.userId === userId) });
        }

        if (type === 'budget') {
            const budgets = await getBudget();
            budgets[userId] = data;
            await saveBudget(budgets);
            return NextResponse.json({ success: true, budget: data });
        }

        if (type === 'delete_transaction') {
            const { id } = data;
            let transactions = await getTransactions();
            // Ensure user owns the transaction before deleting
            const txIndex = transactions.findIndex(t => t.id === id && t.userId === userId);
            if (txIndex !== -1) {
                transactions.splice(txIndex, 1);
                await saveTransactions(transactions);
            }
            return NextResponse.json({ success: true, transactions: transactions.filter(t => t.userId === userId) });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
