import { NextResponse } from 'next/server';
import { getUser } from '@/lib/dal/auth';
import { getMonthlyReminders, getPredictiveBalanceData } from '@/lib/dal/reminders';
import { getTransactions, getBudget } from '@/lib/dal/finance';
import { sanitizeAndAggregateFinancialData } from '@/lib/ai/sanitizer';
import { generateAIAnalyticsInsights } from '@/lib/ai/gemini';
import { UserModel } from '@/lib/models';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

// Rate limit cooldown in seconds between explicit generations
const RATE_LIMIT_COOLDOWN_SECONDS = 60;

export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check user AI consent
        const isConsented = user.aiConsent?.enabled === true;
        if (!isConsented) {
            return NextResponse.json({
                isConsented: false,
                summary: "AI Insights are currently disabled. Enable AI in Settings or via the prompt above to receive personalized anomaly detection, bill reminders, and budget analysis.",
                healthScore: 0,
                insights: [],
                generatedAt: new Date().toISOString(),
                hasRunBefore: false
            });
        }

        // Return stored/persisted insights directly without calling Gemini API on page refresh
        if (user.aiInsights?.data) {
            return NextResponse.json({
                ...user.aiInsights.data,
                isConsented: true,
                hasRunBefore: true,
                lastGeneratedAt: user.aiInsights.lastGeneratedAt || user.aiInsights.data.generatedAt
            });
        }

        // If no insights generated yet, return empty state with hasRunBefore: false
        return NextResponse.json({
            isConsented: true,
            hasRunBefore: false,
            summary: "No insights generated yet. Click \"Generate New Insights\" below to run an analytical evaluation of your spending patterns and cashflow.",
            healthScore: 0,
            insights: [],
            generatedAt: null
        });
    } catch (error: any) {
        console.error("AI Insights GET error:", error);
        return NextResponse.json({
            error: error.message || 'Failed to retrieve AI insights',
            isConsented: true,
            summary: "Unable to retrieve insights at this moment.",
            healthScore: 0,
            insights: []
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.aiConsent?.enabled !== true) {
            return NextResponse.json({ error: 'AI Consent not granted. Please enable AI in Settings first.' }, { status: 403 });
        }

        // Rate Limit Enforcement (Cooldown check)
        const lastGeneratedAtStr = user.aiInsights?.lastGeneratedAt;
        if (lastGeneratedAtStr) {
            const lastGenerated = new Date(lastGeneratedAtStr).getTime();
            const elapsedSeconds = Math.floor((Date.now() - lastGenerated) / 1000);
            if (elapsedSeconds < RATE_LIMIT_COOLDOWN_SECONDS) {
                const remaining = RATE_LIMIT_COOLDOWN_SECONDS - elapsedSeconds;
                return NextResponse.json({
                    error: `Please wait ${remaining}s before generating new insights.`,
                    cooldownRemaining: remaining
                }, { status: 429 });
            }
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const prevMonthDate = new Date(year, month - 2, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth() + 1;

        const [
            currentTxnsResult,
            prevTxnsResult,
            monthlyReminders,
            budget,
            predictiveData
        ] = await Promise.all([
            getTransactions({ limit: 150, sort: 'date', sortDirection: 'desc' }),
            getTransactions({
                startDate: new Date(prevYear, prevMonth - 1, 1),
                endDate: new Date(prevYear, prevMonth, 0, 23, 59, 59),
                limit: 150
            }),
            getMonthlyReminders(year, month),
            getBudget(),
            getPredictiveBalanceData(year, month)
        ]);

        const currentBalance = predictiveData.currentBalance || 0;

        const payload = sanitizeAndAggregateFinancialData({
            currentTransactions: currentTxnsResult.data || [],
            previousTransactions: prevTxnsResult.data || [],
            reminders: monthlyReminders || [],
            budget,
            currency: user.currency || 'INR',
            currentBalance
        });

        // Run Gemini AI Analytics
        const insights = await generateAIAnalyticsInsights({
            userId: user._id.toString(),
            payload,
            forceRefresh: true
        });

        const generatedTimestamp = new Date().toISOString();

        // Persist to MongoDB User Record
        await dbConnect();
        await UserModel.findByIdAndUpdate(user._id, {
            $set: {
                aiInsights: {
                    data: insights,
                    lastGeneratedAt: generatedTimestamp
                }
            }
        });

        return NextResponse.json({
            ...insights,
            hasRunBefore: true,
            lastGeneratedAt: generatedTimestamp
        });
    } catch (error: any) {
        console.error("AI Insights POST error:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate AI insights' }, { status: 500 });
    }
}
