import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import { UserModel, TransactionModel, BudgetModel, BudgetPeriodModel, RecurringRuleModel } from '@/lib/models';
import { sendInactivityWarningEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    console.log("Starting DB Cleanup & Inactivity Cron Job...");

    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.error("Unauthorized Cron Attempt");
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await dbConnect();
        const users = await UserModel.find({});
        console.log(`Analyzing ${users.length} users for inactivity...`);

        const results = {
            deleted: 0,
            warned38: 0,
            warned42: 0,
            warned44: 0,
            errors: 0
        };

        const now = Date.now();

        for (const user of users) {
            try {
                // Find latest transaction
                const lastTx = await TransactionModel.findOne({ userId: user.username }).sort({ date: -1 });
                
                // Determine last active date
                let lastActive = user._id.getTimestamp(); // Fallback to account creation date
                if (lastTx && lastTx.date) {
                    lastActive = new Date(lastTx.date);
                }

                const daysInactive = Math.floor((now - lastActive.getTime()) / (1000 * 60 * 60 * 24));
                
                // Normalize notices object
                const notices = user.inactivityNotices || { sent38: false, sent42: false, sent44: false };

                // Deletion Threshold
                if (daysInactive >= 45) {
                    console.log(`[DELETION] User ${user.username} inactive for ${daysInactive} days. Wiping...`);
                    
                    await TransactionModel.deleteMany({ userId: user.username });
                    await BudgetModel.deleteMany({ userId: user.username });
                    await BudgetPeriodModel.deleteMany({ userId: user.username });
                    await RecurringRuleModel.deleteMany({ userId: user.username });
                    await UserModel.deleteOne({ _id: user._id });
                    
                    results.deleted++;
                    continue; // Skip further checks for this user
                }
                
                // Warning Checks
                // Make sure to only send if we have a valid email
                if (user.email) {
                    let shouldSave = false;
                    
                    if (daysInactive >= 44 && !notices.sent44) {
                        const sent = await sendInactivityWarningEmail(user.email, 1);
                        if (sent) {
                            notices.sent44 = true;
                            shouldSave = true;
                            results.warned44++;
                        }
                    } else if (daysInactive >= 42 && daysInactive < 44 && !notices.sent42) {
                        const sent = await sendInactivityWarningEmail(user.email, 3);
                        if (sent) {
                            notices.sent42 = true;
                            shouldSave = true;
                            results.warned42++;
                        }
                    } else if (daysInactive >= 38 && daysInactive < 42 && !notices.sent38) {
                        const sent = await sendInactivityWarningEmail(user.email, 7);
                        if (sent) {
                            notices.sent38 = true;
                            shouldSave = true;
                            results.warned38++;
                        }
                    }

                    if (shouldSave) {
                        user.inactivityNotices = notices;
                        await user.save();
                    }
                }

            } catch (userErr) {
                console.error(`Error processing user ${user.username}:`, userErr);
                results.errors++;
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Cleanup Cron Job Fatal Error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
