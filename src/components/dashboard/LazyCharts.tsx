"use client";

import dynamic from "next/dynamic";
import { ChartControls } from "@/components/analytics/ChartControls";

// Dynamic Imports with SSG disabled for heavy visualization components
// These are now allowed because this file is a Client Component ("use client")
const SpendingBarChart = dynamic(
    () => import("@/components/charts/SpendingBarChart").then(mod => mod.SpendingBarChart),
    {
        ssr: false,
        loading: () => <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-xl" />
    }
);

const TopCategoriesChart = dynamic(
    () => import("@/components/charts/TopCategoriesChart").then(mod => mod.TopCategoriesChart),
    {
        ssr: false,
        loading: () => <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-xl" />
    }
);

interface LazyChartsProps {
    spendingData: any[];
    topCategories: any[];
    categories: string[];
    periodLabel: string;
    currency: string;
}

export function LazyCharts({
    spendingData,
    topCategories,
    categories,
    periodLabel,
    currency
}: LazyChartsProps) {
    return (
        <div className="h-full flex flex-col space-y-4">
            <ChartControls categories={categories} />

            <div className="grid grid-cols-1 2xl:grid-cols-7 gap-4 min-h-[400px]">
                {/* Main Spending Chart - Stacks on XL, 5 cols on 2XL */}
                <div className="h-[400px] 2xl:col-span-5">
                    <SpendingBarChart
                        data={spendingData}
                        periodLabel={periodLabel}
                        currency={currency}
                        budget={2500} // Hardcoded budget for visual logic as planned
                    />
                </div>

                {/* Top Categories - Stacks on XL, 2 cols on 2XL */}
                <div className="h-[400px] 2xl:col-span-2">
                    <TopCategoriesChart
                        data={topCategories}
                        currency={currency}
                    />
                </div>
            </div>
        </div>
    );
}
