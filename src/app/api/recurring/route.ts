import { NextResponse } from 'next/server';
import { getRecurringRules, saveRecurringRules, getTransactions, saveTransactions } from '@/lib/storage';
import { RecurringRule, Transaction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[Recurring GET] Fetching rules...');
        const rules = await getRecurringRules();
        console.log('[Recurring GET] Fetched', rules.length, 'rules');
        return NextResponse.json({ rules });
    } catch (error) {
        console.error('[Recurring GET] Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Failed to fetch rules', details: errorMessage }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        console.log('[Recurring POST] Starting...');
        const body = await request.json();
        const { action, rule } = body;
        console.log('[Recurring POST] Action:', action);

        let rules = await getRecurringRules();

        if (action === 'add') {
            console.log('[Recurring POST] Adding rule:', rule.description);
            rules.push(rule);
            await saveRecurringRules(rules);
            console.log('[Recurring POST] Rule added successfully');
            return NextResponse.json({ success: true, rules });
        }

        if (action === 'delete') {
            console.log('[Recurring POST] Deleting rule:', rule.id);
            rules = rules.filter(r => r.id !== rule.id);
            await saveRecurringRules(rules);
            console.log('[Recurring POST] Rule deleted successfully');
            return NextResponse.json({ success: true, rules });
        }

        if (action === 'process') {
            console.log('[Recurring POST] Processing rules...');
            const transactions = await getTransactions();
            const today = new Date();
            let newTransactions: Transaction[] = [];
            let updatedRules = [...rules];

            updatedRules = updatedRules.map(r => {
                if (!r.active) return r;

                let nextDue = new Date(r.nextDueDate);
                let processed = false;

                while (nextDue <= today) {
                    newTransactions.push({
                        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        amount: r.amount,
                        type: r.type,
                        category: r.category,
                        description: `Recurring: ${r.description}`,
                        date: nextDue.toISOString(),
                        recurringRuleId: r.id
                    });

                    if (r.frequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
                    if (r.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
                    if (r.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
                    if (r.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);

                    processed = true;
                }

                if (processed) {
                    return { ...r, nextDueDate: nextDue.toISOString() };
                }
                return r;
            });

            if (newTransactions.length > 0) {
                await saveTransactions([...transactions, ...newTransactions]);
                await saveRecurringRules(updatedRules);
            }

            console.log('[Recurring POST] Generated', newTransactions.length, 'new transactions');
            return NextResponse.json({ success: true, newTransactionsCount: newTransactions.length });
        }

        console.log('[Recurring POST] Invalid action:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('[Recurring POST] Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage, stack }, { status: 500 });
    }
}
