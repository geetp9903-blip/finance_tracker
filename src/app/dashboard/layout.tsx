import { ReactNode } from "react";
import { assertAuth } from "@/lib/dal/auth";
import Link from "next/link";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
    [key: string]: any;
}) {
    await assertAuth(); // Protect layout auth

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back to your financial control center</p>
                </div>
                <div className="flex items-center space-x-2">
                    <DashboardFilter />
                    <CurrencySelector />
                    <Link href="/settings" className="px-3 py-2 text-sm font-medium hover:bg-accent rounded-lg border border-border/50">
                        Settings
                    </Link>
                </div>
            </div>

            {children}
        </div>
    );
}
