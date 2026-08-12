import { getUser } from "@/lib/dal/auth";
import { getPredictiveBalanceData, getMonthlyReminders } from "@/lib/dal/reminders";
import { getTransactions } from "@/lib/dal/finance";
import { getSpendingChartData, getTopCategories } from "@/lib/dal/analytics";
import { getDefaultDashboardLayout } from "@/lib/dashboard/widgetRegistry";
import { CustomizableDashboard } from "@/components/dashboard/CustomizableDashboard";

export const revalidate = 60;

export default async function DashboardPage() {
    const user = await getUser();
    if (!user) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const periodKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = now.toLocaleString('default', { month: 'long' });
    const periodLabel = `${monthName} ${year}`;

    const [
        predictiveData,
        monthlyReminders,
        transactionsResult,
        spendingData,
        topCategories
    ] = await Promise.all([
        getPredictiveBalanceData(year, month),
        getMonthlyReminders(year, month),
        getTransactions(100),
        getSpendingChartData(year, month, 'All'),
        getTopCategories(year, month),
    ]);

    const sanitizedTransactions = (transactionsResult.data || []).map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type as 'income' | 'expense',
        category: t.category,
        date: t.date
    }));

    const initialLayout = user.dashboardLayout || getDefaultDashboardLayout();

    return (
        <CustomizableDashboard
            initialLayout={initialLayout}
            spendingData={spendingData || []}
            topCategoriesData={topCategories || []}
            predictiveData={predictiveData}
            monthlyRemindersData={monthlyReminders || []}
            sanitizedTransactions={sanitizedTransactions}
            allTransactions={sanitizedTransactions}
            currency={user.currency || 'INR'}
            periodLabel={periodLabel}
            periodKey={periodKey}
        />
    );
}
