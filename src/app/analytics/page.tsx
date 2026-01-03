import { getDailySpending, getCategoryTrends } from "@/lib/dal/analytics";
import { SpendingBarChart } from "@/components/charts/SpendingBarChart";
import { CategoryLineChart } from "@/components/charts/CategoryLineChart";
import { DateRangeSelector } from "@/components/analytics/DateRangeSelector";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
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
    const [dailySpend, categoryTrends] = await Promise.all([
        getDailySpending(startDate, endDate),
        getCategoryTrends(startDate, endDate)
    ]);

    // 3. Transformation for UI
    const barData = dailySpend.map(d => ({
        label: d._id,
        value: d.amount,
        count: d.count
    }));



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
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        <h3 className="text-lg font-medium">Total Spending Trend</h3>
                        <div className="mt-4">
                            <SpendingBarChart data={barData} periodLabel="Spending Overview" currency={currency} />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        {/* Wrapper to control height if needed, but Chart handles it */}
                        <div className="mt-0">
                            <CategoryLineChart data={categoryTrends} currency={currency} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
