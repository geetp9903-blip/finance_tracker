import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import { RecurringRuleModel, TransactionModel } from '@/lib/models';
import { randomUUID } from 'crypto';

// CRON jobs must be dynamic to run on schedule
export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Starting Recurring Transaction Cron Job...");

    // 1. Zero-Trust Security Check
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error("Unauthorized Cron Attempt");
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await dbConnect();

        const today = new Date();
        // Normalize today to start of day for comparison
        today.setHours(0, 0, 0, 0);

        // 2. Fetch Active Rules
        // "nextDueDate" should be stored in ISO format. We find rules where nextDueDate <= now
        const dueRules = await RecurringRuleModel.find({
            active: true,
            nextDueDate: { $lte: today.toISOString() }
        });

        console.log(`Found ${dueRules.length} rules due for processing.`);

        const results = [];

        for (const rule of dueRules) {
            try {
                // 3. IDEMPOTENCY CHECK
                // Ideally use a separate 'JobLog' table or Redis key like `recurring:processed:{ruleId}:{date}`
                // For this implementation, we check if a transaction with this ruleId exists for the *calculated due date*.
                // However, the rule's 'lastProcessed' field is a simpler optimization. 
                // A robust check: 
                const ruleDate = new Date(rule.nextDueDate);
                if (rule.lastProcessed) {
                    const last = new Date(rule.lastProcessed);
                    if (last.getTime() >= ruleDate.getTime()) {
                        console.warn(`Rule ${rule.id} already processed for this cycle. Skipping.`);
                        continue;
                    }
                }

                // Create Transaction
                const newTransaction = {
                    id: randomUUID(),
                    userId: rule.userId,
                    amount: rule.amount,
                    type: rule.type,
                    category: rule.category,
                    description: `${rule.description} (Recurring)`,
                    date: new Date().toISOString(), // Transaction happens NOW
                    recurrenceId: rule.id
                };

                await TransactionModel.create(newTransaction);

                // Update Rule Next Date
                const nextDate = new Date(ruleDate);
                // Increment based on frequency
                switch (rule.frequency) {
                    case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                    case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                    case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                    case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                }

                rule.nextDueDate = nextDate.toISOString();
                rule.lastProcessed = new Date().toISOString();
                await rule.save();

                results.push({ ruleId: rule.id, status: 'success' });

            } catch (innerError) {
                console.error(`Failed to process rule ${rule.id}`, innerError);
                results.push({ ruleId: rule.id, status: 'error', error: String(innerError) });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });

    } catch (error) {
        console.error("Cron Job Fatal Error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
