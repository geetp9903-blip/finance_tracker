"use client";
import { useMemo, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "@/components/ui/Card";
import { Transaction } from "@/lib/types";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";

interface ParetoChartProps {
    transactions: Transaction[];
    formatAmount: (amount: number) => string;
}

const truncate = (str: string, length: number) => {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};

export function ParetoChart({ transactions, formatAmount }: ParetoChartProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

    const chartData = useMemo(() => {
        // Filter for selected period
        const filtered = transactions.filter(t => {
            const d = new Date(t.date);
            const isYearMatch = d.getFullYear() === selectedDate.getFullYear();
            if (!isYearMatch) return false;

            if (viewMode === 'month') {
                return d.getMonth() === selectedDate.getMonth();
            }
            return true; // Year mode covers all months
        }).filter(t => t.type === 'expense');

        // Group by Category
        const categoryMap = new Map<string, number>();
        let totalExpenses = 0;

        filtered.forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + t.amount);
            totalExpenses += t.amount;
        });

        if (totalExpenses === 0) return [];

        // Convert to array and sort descending
        const allCategories = Array.from(categoryMap.entries())
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: (amount / totalExpenses) * 100
            }))
            .sort((a, b) => b.amount - a.amount);

        // Consolidate: Keep top categories (>=5% or top 7), group rest into "Others"
        const significant: Array<{ name: string; amount: number; percentage: number }> = [];
        let othersTotal = 0;

        allCategories.forEach((cat, index) => {
            // Keep if: percentage >= 5% or it's one of the top 5 largest expenses regardless of %
            if ((cat.percentage >= 5 || index < 5) && significant.length < 7) {
                significant.push(cat);
            } else {
                othersTotal += cat.amount;
            }
        });

        // Add "Others" category if there are consolidated items
        if (othersTotal > 0) {
            significant.push({
                name: 'Others',
                amount: othersTotal,
                percentage: (othersTotal / totalExpenses) * 100
            });
        }

        // Calculate Cumulative percentage for Pareto line
        let cumulative = 0;
        return significant.map(item => {
            cumulative += item.amount;
            return {
                ...item,
                cumulativePercentage: min(100, (cumulative / totalExpenses) * 100) // Caps at 100 just in case float math exceeds slightly
            };
        });
    }, [transactions, selectedDate, viewMode]);

    return (
        <Card className="glass-card p-4 sm:p-6 h-full flex flex-col overflow-hidden min-w-0">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Pareto Analysis (80/20 Rule)</h3>
                        <p className="text-sm text-muted-foreground">Top categories driving your spending.</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                    <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('year')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${viewMode === 'year' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Year
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${viewMode === 'month' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Month
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {viewMode === 'year' ? (
                            <select
                                className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                                value={selectedDate.getFullYear()}
                                onChange={(e) => {
                                    const newDate = new Date(selectedDate);
                                    newDate.setFullYear(parseInt(e.target.value));
                                    setSelectedDate(newDate);
                                }}
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                    <option key={year} value={year} className="bg-slate-900">{year}</option>
                                ))}
                            </select>
                        ) : (
                            <MonthYearPicker selectedDate={selectedDate} onChange={setSelectedDate} />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full mt-4 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={true}
                            interval={0}
                            className="text-xs"
                        />
                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} width={0} hide />
                        <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="%" width={30} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number, name: string) => {
                                if (name === 'cumulativePercentage') return [`${value.toFixed(1)}%`, 'Cumulative Impact'];
                                return [formatAmount(value), 'Amount'];
                            }}
                        />
                        <Bar yAxisId="left" dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#ec4899' : '#8b5cf6'} fillOpacity={0.8} />
                            ))}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
                * Pink bars = Top contributors. Green line = Cumulative impact.
            </div>
        </Card>
    );
}

function min(a: number, b: number) { return a < b ? a : b; }
