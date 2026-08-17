import { NextResponse } from 'next/server';
import { getUser, assertAuth } from '@/lib/dal/auth';
import { getMonthlyReminders, getPredictiveBalanceData } from '@/lib/dal/reminders';
import { getTransactions, getBudget } from '@/lib/dal/finance';
import { sanitizeAndAggregateFinancialData } from '@/lib/ai/sanitizer';
import { generateAIAnalyticsInsights, invalidateUserAICache } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

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
                generatedAt: new Date().toISOString()
            });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Previous month for run-rate comparisons
        const prevMonthDate = new Date(year, month - 2, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth() + 1;

        // Fetch user financial records
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

        // Sanitize data (strips PII)
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
            forceRefresh: false
        });

        return NextResponse.json(insights);
    } catch (error: any) {
        console.error("AI Insights GET error:", error);
        return NextResponse.json({
            error: error.message || 'Failed to generate AI insights',
            isConsented: true,
            summary: "Unable to generate insights at this moment. Please check your network or try again in a few moments.",
            healthScore: 70,
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
            return NextResponse.json({ error: 'AI Consent not granted' }, { status: 403 });
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

        // Force refresh by invalidating cache
        const insights = await generateAIAnalyticsInsights({
            userId: user._id.toString(),
            payload,
            forceRefresh: true
        });

        return NextResponse.json(insights);
    } catch (error: any) {
        console.error("AI Insights POST error:", error);
        return NextResponse.json({ error: error.message || 'Failed to refresh AI insights' }, { status: 500 });
    }
}
