import { ReactNode } from "react";
import { assertAuth } from "@/lib/dal/auth";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
// We might need a Logout button component that uses Server Actions

export default async function DashboardLayout({
    children,
    metrics,
    charts,
    transactions
}: {
    children: ReactNode;
    metrics: ReactNode;
    charts: ReactNode;
    transactions: ReactNode;
}) {
    const userId = await assertAuth(); // Protects the entire layout

    return (
        <div className="min-h-screen bg-background text-foreground space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back</p>
                </div>
                <div className="flex items-center space-x-2">
                    <CurrencySelector />
                    {/* Placeholder for toolbar or specific page actions */}
                    <Link href="/settings" className="p-2 hover:bg-accent rounded-md">Settings</Link>
                </div>
            </div>

            {/* 
         Parallel Routes allow us to stream these independently.
         If 'charts' takes 2s, 'metrics' (100ms) will still show immediately. 
      */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow glass-card">
                    {charts}
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow glass-card">
                    {transactions}
                </div>
            </div>

            {children}
        </div>
    );
}
