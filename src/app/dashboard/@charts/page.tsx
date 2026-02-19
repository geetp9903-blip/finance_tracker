import { getSpendingChartData, getTopCategories } from "@/lib/dal/analytics";
import { getUser } from "@/lib/dal/auth";
import { TransactionModel } from "@/lib/models";
import dbConnect from "@/lib/db";
import { LazyCharts } from "@/components/dashboard/LazyCharts";

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
        <LazyCharts
            spendingData={spendingData}
            topCategories={topCategories}
            categories={categories || []}
            periodLabel={periodLabel}
            currency={user.currency || 'USD'}
        />
    );
}
