import { NextResponse } from 'next/server';
import { getRecurringRules, saveRecurringRules, getTransactions, saveTransactions } from '@/lib/storage';
import { RecurringRule, Transaction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        console.log('[Recurring GET] Fetching rules for user:', userId);
        const allRules = await getRecurringRules();
        const rules = allRules.filter(r => r.userId === userId);
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
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        console.log('[Recurring POST] Starting for user:', userId);
        const body = await request.json();
        const { action, rule } = body;
        console.log('[Recurring POST] Action:', action);

        let rules = await getRecurringRules();

        if (action === 'add') {
            console.log('[Recurring POST] Adding rule:', rule.description);
            const newRule = { ...rule, userId };
            rules.push(newRule);
            await saveRecurringRules(rules);
            console.log('[Recurring POST] Rule added successfully');
            return NextResponse.json({ success: true, rules: rules.filter(r => r.userId === userId) });
        }

        if (action === 'delete') {
            console.log('[Recurring POST] Deleting rule:', rule.id);
            // Ensure user owns the rule
            const ruleIndex = rules.findIndex(r => r.id === rule.id && r.userId === userId);
            if (ruleIndex !== -1) {
                rules.splice(ruleIndex, 1);
                await saveRecurringRules(rules);
            }
            console.log('[Recurring POST] Rule deleted successfully');
            return NextResponse.json({ success: true, rules: rules.filter(r => r.userId === userId) });
        }

        if (action === 'process') {
            console.log('[Recurring POST] Processing rules...');
            const transactions = await getTransactions();
            const today = new Date();
            let newTransactions: Transaction[] = [];

            // Only process user's rules
            const userRules = rules.filter(r => r.userId === userId);
            let updatedRules = [...rules]; // We need to update global rules array but only modify user's rules

            // Map over global rules, but only process if it matches user
            updatedRules = updatedRules.map(r => {
                if (r.userId !== userId || !r.active) return r;

                let nextDue = new Date(r.nextDueDate);
                let processed = false;

                while (nextDue <= today) {
                    newTransactions.push({
                        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        userId: userId, // Tag new transaction
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
