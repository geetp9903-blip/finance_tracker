
import { getFinancialSummary } from "@/lib/dal/finance";
import { QuickStats } from "@/components/dashboard/QuickStats";

// Metrics are fast, but we want them fresh.
export const dynamic = 'force-dynamic';

import { assertAuth } from "@/lib/dal/auth";
import { UserModel } from "@/lib/models";
import dbConnect from "@/lib/db";

export default async function MetricsPage(props: {
    searchParams: Promise<{ period?: string; month?: string; year?: string }>;
}) {
    const searchParams = await props.searchParams;
    const userId = await assertAuth();
    await dbConnect();
    // userId from session is actually the username in this system
    const user = await UserModel.findOne({ username: userId }).lean();
    const currency = user?.currency || 'INR';

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let periodLabel = 'Overall';

    const period = searchParams?.period || 'all';
    const yearParam = searchParams?.year ? parseInt(searchParams.year) : now.getFullYear();
    const monthParam = searchParams?.month ? parseInt(searchParams.month) : now.getMonth();

    const MONTHS = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (period === 'month') {
        startDate = new Date(yearParam, monthParam, 1);
        endDate = new Date(yearParam, monthParam + 1, 0); // Last day of the month
        periodLabel = `${MONTHS[monthParam]} ${yearParam}`;
    } else if (period === 'year') {
        startDate = new Date(yearParam, 0, 1);
        endDate = new Date(yearParam, 11, 31);
        periodLabel = `Year ${yearParam}`;
    }

    const summary = await getFinancialSummary(startDate, endDate);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <QuickStats 
            balance={summary.balance}
            income={summary.income}
            expense={summary.expense}
            transactionCount={summary.transactionCount}
            currency={currency}
            periodLabel={periodLabel}
        />
    );
}
