
import { getFinancialSummary } from "@/lib/dal/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

// Metrics are fast, but we want them fresh.
export const dynamic = 'force-dynamic';

import { assertAuth } from "@/lib/dal/auth";
import { UserModel } from "@/lib/models";
import dbConnect from "@/lib/db";

export default async function MetricsPage() {
    const userId = await assertAuth();
    await dbConnect();
    // userId from session is actually the username in this system
    const user = await UserModel.findOne({ username: userId }).lean();
    const currency = user?.currency || 'INR';

    const now = new Date();
    // Default to current month for summary
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const summary = await getFinancialSummary(startOfMonth, endOfMonth);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <>
            <Card className="hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatter.format(summary.balance)}</div>
                    <p className="text-xs text-muted-foreground">Current Month</p>
                </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-500">{formatter.format(summary.income)}</div>
                    <p className="text-xs text-muted-foreground">+{summary.transactionCount} txns</p>
                </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatter.format(summary.expense)}</div>
                    <p className="text-xs text-muted-foreground">Current Month</p>
                </CardContent>
            </Card>

            <Card className="hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {summary.income > 0 ? ((summary.income - summary.expense) / summary.income * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">of Income</p>
                </CardContent>
            </Card>
        </>
    );
}
