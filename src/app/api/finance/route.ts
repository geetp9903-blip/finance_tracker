import { NextResponse } from 'next/server';
import { getTransactions, saveTransactions, getBudget, saveBudget } from '@/lib/storage';

export async function GET() {
    try {
        const transactions = await getTransactions();
        const budget = await getBudget();
        return NextResponse.json({ transactions, budget });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { type, data } = await request.json();

        if (type === 'transaction') {
            const transactions = await getTransactions();
            // data is the new transaction object
            transactions.push(data);
            await saveTransactions(transactions);
            return NextResponse.json({ success: true, transactions });
        }

        if (type === 'budget') {
            // data is the full budget object
            await saveBudget(data);
            return NextResponse.json({ success: true, budget: data });
        }

        if (type === 'delete_transaction') {
            const { id } = data;
            let transactions = await getTransactions();
            transactions = transactions.filter(t => t.id !== id);
            await saveTransactions(transactions);
            return NextResponse.json({ success: true, transactions });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
