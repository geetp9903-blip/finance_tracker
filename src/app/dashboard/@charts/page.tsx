import { ChartControls } from "@/components/analytics/ChartControls";
import { SpendingBarChart } from "@/components/charts/SpendingBarChart";
import { TopCategoriesChart } from "@/components/charts/TopCategoriesChart";
import { getSpendingChartData, getTopCategories } from "@/lib/dal/analytics";
import { getUser } from "@/lib/dal/auth";
import { TransactionModel } from "@/lib/models";
import dbConnect from "@/lib/db";

// Use SearchParams for dynamic filtering
export default async function ChartsPage({
    searchParams
}: {
    searchParams: Promise<{ view?: string; month?: string; year?: string; category?: string }>
}) {
    const params = await searchParams;
    const user = await getUser();
    if (!user) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Parse Params
    const view = params.view || 'month';
    const year = Number(params.year) || currentYear;
    const month = view === 'month'
        ? (Number(params.month) || currentMonth)
        : undefined;
    const category = params.category || 'All';

    // Fetch Data
    const [spendingData, topCategories] = await Promise.all([
        getSpendingChartData(year, month, category),
        getTopCategories(year, month)
    ]);

    // Fetch Categories for Filter
    await dbConnect();
    const categories = await TransactionModel.distinct('category', { userId: user.username });

    // Label Generation
    const monthName = month ? new Date(year, month - 1).toLocaleString('default', { month: 'long' }) : '';
    const periodLabel = view === 'month'
        ? `${monthName} ${year}`
        : `${year} Annual Overview`;

    return (
        <div className="h-full flex flex-col space-y-4">
            <ChartControls categories={categories} />

            <div className="grid grid-cols-1 2xl:grid-cols-7 gap-4 min-h-[400px]">
                {/* Main Spending Chart - Stacks on XL, 5 cols on 2XL */}
                <div className="h-[400px] 2xl:col-span-5">
                    <SpendingBarChart
                        data={spendingData}
                        periodLabel={periodLabel}
                        currency={user.currency || 'USD'}
                    />
                </div>

                {/* Top Categories - Stacks on XL, 2 cols on 2XL */}
                <div className="h-[400px] 2xl:col-span-2">
                    <TopCategoriesChart
                        data={topCategories}
                        currency={user.currency || 'USD'}
                    />
                </div>
            </div>
        </div>
    );
}
