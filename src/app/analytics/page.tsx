"use client";
import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { CategoryTrendChart } from "@/components/analytics/CategoryTrendChart";
import { CategoryComparisonChart } from "@/components/analytics/CategoryComparisonChart";

export default function AnalyticsPage() {
    const { transactions, formatAmount, isLoading } = useFinance();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'year'>('year');

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-foreground bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-2 shadow-sm w-fit">Analytics</h1>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 rounded-xl text-sm transition-all ${viewMode === 'month' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/5'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setViewMode('year')}
                            className={`px-3 py-1 rounded-xl text-sm transition-all ${viewMode === 'year' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/5'}`}
                        >
                            Year
                        </button>
                    </div>
                    <MonthYearPicker selectedDate={selectedDate} onChange={setSelectedDate} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 h-[calc(100vh-200px)]">
                <CategoryTrendChart transactions={transactions} formatAmount={formatAmount} />
                <CategoryComparisonChart transactions={transactions} formatAmount={formatAmount} />
            </div>
        </div>
    );
}
