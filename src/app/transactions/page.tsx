import { getTransactions } from "@/lib/dal/finance";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { ExportButton } from "@/components/transactions/ExportButton";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import { assertAuth } from "@/lib/dal/auth";
import { UserModel } from "@/lib/models";
import dbConnect from "@/lib/db";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: {
        page?: string;
        query?: string;
        type?: 'income' | 'expense' | 'all';
        month?: string;
        year?: string;
        sort?: string;
        dir?: string;
    }
}

export default async function TransactionsPage({ searchParams }: PageProps) {
    // 1. Parse Search Params
    const {
        page: pageParam,
        query: queryParam,
        type: typeParam,
        month: monthParam,
        year: yearParam,
        sort: sortParam,
        dir: dirParam
    } = await searchParams;

    const page = Number(pageParam) || 1;
    const query = queryParam || "";
    const type = typeParam || 'all';
    const sort = (sortParam as 'date' | 'amount') || 'date';
    const sortDirection = (dirParam as 'asc' | 'desc') || 'desc';

    // Date Logic
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // Default to handling all time if no specific date filter, 
    // BUT user often expects "Current Month" in many apps. 
    // Here we'll default to "All Time" to match previous behavior unless filter is set.
    if (monthParam && yearParam) {
        const y = Number(yearParam);
        const m = Number(monthParam);
        startDate = new Date(Date.UTC(y, m - 1, 1));
        endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    } else if (yearParam) {
        const y = Number(yearParam);
        startDate = new Date(Date.UTC(y, 0, 1));
        endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    }

    // 2. Fetch Data (Server Side)
    // Fetch User for Currency
    const userId = await assertAuth();
    await dbConnect();
    const user = await UserModel.findOne({ username: userId }).lean();
    const currency = user?.currency || 'INR';

    const { data: transactions, metadata } = await getTransactions({
        page,
        limit: 50,
        query,
        type,
        startDate,
        endDate,
        sort,
        sortDirection
    });

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                    <p className="text-muted-foreground">Manage your entire financial history.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExportButton currency={currency} />
                    <AddTransactionButton />
                </div>
            </div>

            <TransactionTable
                transactions={transactions}
                metadata={metadata}
                currency={currency}
            />
        </div>
    );
}
