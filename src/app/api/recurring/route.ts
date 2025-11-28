import { NextResponse } from 'next/server';
import { getRecurringRules, createRecurringRule, deleteRecurringRule, updateRecurringRule, createTransaction } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const rules = await getRecurringRules(userId);
        return NextResponse.json({ rules });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch recurring rules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const { action, rule, id } = await request.json();

        if (action === 'add') {
            const newRule = { ...rule, userId };
            await createRecurringRule(newRule);
            const rules = await getRecurringRules(userId);
            return NextResponse.json({ success: true, rules });
        }

        if (action === 'delete') {
            await deleteRecurringRule(id, userId);
            const rules = await getRecurringRules(userId);
            return NextResponse.json({ success: true, rules });
        }

        if (action === 'process') {
            const rules = await getRecurringRules(userId);
            const today = new Date();
            let processedCount = 0;

            for (const r of rules) {
                if (!r.active) continue;
                const nextDue = new Date(r.nextDueDate);

                if (nextDue <= today) {
                    // Create transaction
                    const newTransaction = {
                        id: crypto.randomUUID(),
                        userId,
                        amount: r.amount,
                        type: r.type,
                        category: r.category,
                        description: r.description + ' (Recurring)',
                        date: new Date().toISOString(),
                        recurringRuleId: r.id
                    };
                    await createTransaction(newTransaction);

                    // Update next due date
                    const nextDate = new Date(nextDue);
                    if (r.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                    if (r.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                    if (r.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                    if (r.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

                    r.nextDueDate = nextDate.toISOString();
                    r.lastProcessed = new Date().toISOString();
                    await updateRecurringRule(r);
                    processedCount++;
                }
            }

            return NextResponse.json({ success: true, processed: processedCount });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Recurring API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
