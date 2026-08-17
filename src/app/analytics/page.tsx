import { getDailySpending, getCategoryTrends } from "@/lib/dal/analytics";
import { getFinancialSummary } from "@/lib/dal/finance";
import { BalanceDepletionChart } from "@/components/charts/BalanceDepletionChart";
import { CategoryStackedAreaChart } from "@/components/charts/CategoryStackedAreaChart";
import { AIAgentInsightsWidget } from "@/components/dashboard/widgets/AIAgentInsightsWidget";
import { DateRangeSelector } from "@/components/analytics/DateRangeSelector";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { assertAuth } from "@/lib/dal/auth";
import { UserModel } from "@/lib/models";
import dbConnect from "@/lib/db";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: {
        range?: string; // 'month' | 'year' | 'all'
        ref?: string;   // ISO string for reference date
    }
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
    // 1. Calculate Date Range
    const { range: rangeParam, ref: refParam } = await searchParams;
    const range = rangeParam || 'month';
    const refDate = refParam ? new Date(refParam) : new Date();

    let startDate: Date;
    let endDate: Date;

    if (range === 'year') {
        startDate = startOfYear(refDate);
        endDate = endOfYear(refDate);
    } else if (range === 'all') {
        startDate = new Date(0); // Beginning of time
        endDate = new Date();    // Now
    } else {
        // Default: Month
        startDate = startOfMonth(refDate);
        endDate = endOfMonth(refDate);
    }

    // 2. Parallel Data Fetching
    const [dailySpend, categoryTrends, globalSummary, periodSummary] = await Promise.all([
        getDailySpending(startDate, endDate),
        getCategoryTrends(startDate, endDate),
        getFinancialSummary(), // global balance
        getFinancialSummary(startDate, endDate) // period total expenses
    ]);





    // Fetch User Currency
    const userId = await assertAuth();
    await dbConnect();
    const user = await UserModel.findOne({ username: userId }).lean();
    const currency = user?.currency || 'USD';

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">Deep dive into your financial health.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangeSelector />
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1">
                {/* AI Analytical Advisor */}
                <AIAgentInsightsWidget currency={currency} />

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <BalanceDepletionChart 
                        data={dailySpend} 
                        currentGlobalBalance={globalSummary.balance}
                        periodTotalExpenses={periodSummary.expense}
                        periodLabel={range === 'month' ? format(refDate, "MMMM yyyy") : range === 'year' ? format(refDate, "yyyy") : "All Time"} 
                        currency={currency} 
                    />
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <CategoryStackedAreaChart 
                        data={categoryTrends} 
                        periodTotalExpenses={periodSummary.expense}
                        currency={currency} 
                    />
                </div>
            </div>
        </div>
    );
}
