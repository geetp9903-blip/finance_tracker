"use client";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/Card";
import { Transaction } from "@/lib/types";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { cn } from "@/lib/utils";

interface CategoryTrendChartProps {
    transactions: Transaction[];
    formatAmount: (amount: number) => string;
}

const truncate = (str: string, length: number) => {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};

export function CategoryTrendChart({ transactions, formatAmount }: CategoryTrendChartProps) {
    const [selectedCategory, setSelectedCategory] = useState("Food"); // Default
    const [viewMode, setViewMode] = useState<'month' | 'year'>('year');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const uniqueCategories = useMemo(() =>
        Array.from(new Set(transactions.map(t => t.category))),
        [transactions]);

    const chartData = useMemo(() => {
        const dataMap = new Map<string, { amount: number; count: number }>();

        if (viewMode === 'year') {
            for (let i = 0; i < 12; i++) {
                const month = new Date(selectedDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' });
                dataMap.set(month, { amount: 0, count: 0 });
            }
        } else {
            const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                dataMap.set(i.toString(), { amount: 0, count: 0 });
            }
        }

        // Track transactions for average calculation
        const filteredTransactions = transactions.filter(t => {
            if (t.type !== 'expense' || t.category !== selectedCategory) return false;
            const d = new Date(t.date);

            if (viewMode === 'year') {
                return d.getFullYear() === selectedDate.getFullYear();
            } else {
                return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
            }
        });

        filteredTransactions.forEach(t => {
            const d = new Date(t.date);
            let key = "";

            if (viewMode === 'year') {
                key = d.toLocaleString('default', { month: 'short' });
            } else {
                key = d.getDate().toString();
            }

            if (key && dataMap.has(key)) {
                const current = dataMap.get(key)!;
                dataMap.set(key, {
                    amount: current.amount + t.amount,
                    count: current.count + 1
                });
            }
        });

        return Array.from(dataMap.entries()).map(([name, data]) => ({
            name,
            amount: data.amount
        }));
    }, [transactions, selectedCategory, viewMode, selectedDate]);

    return (
        <Card className="glass-card p-6 h-full flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Category Trend</h3>
                    <p className="text-sm text-muted-foreground">Spending over time for {selectedCategory}</p>
                </div>
                <div className="flex flex-col gap-2 scale-90 sm:scale-100 origin-top-right">
                    <div className="flex gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full"
                        >
                            {uniqueCategories.map(c => (
                                <option key={c} value={c} className="bg-card text-foreground">{c}</option>
                            ))}
                        </select>
                        <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn("px-3 py-1 rounded-full text-xs transition-colors", viewMode === 'month' ? "bg-primary text-white" : "text-muted-foreground")}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode('year')}
                                className={cn("px-3 py-1 rounded-full text-xs transition-colors", viewMode === 'year' ? "bg-primary text-white" : "text-muted-foreground")}
                            >
                                Year
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => truncate(val, 8)}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [formatAmount(value), 'amount']}
                        />
                        {/* Average Line */}
                        {(() => {
                            // Calculate average based on actual transactions
                            const filteredData = transactions.filter(t => {
                                if (t.type !== 'expense' || t.category !== selectedCategory) return false;
                                const d = new Date(t.date);

                                if (viewMode === 'year') {
                                    return d.getFullYear() === selectedDate.getFullYear();
                                } else {
                                    return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                                }
                            });

                            if (filteredData.length === 0) return null;

                            let avg = 0;
                            if (viewMode === 'month') {
                                // Month view: sum / number of transactions
                                const total = filteredData.reduce((sum, t) => sum + t.amount, 0);
                                avg = total / filteredData.length;
                            } else {
                                // Year view: sum / number of months with non-zero data
                                const monthlyTotals = new Map<number, number>();
                                filteredData.forEach(t => {
                                    const month = new Date(t.date).getMonth();
                                    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + t.amount);
                                });

                                const total = Array.from(monthlyTotals.values()).reduce((sum, val) => sum + val, 0);
                                const nonZeroMonths = monthlyTotals.size;
                                avg = nonZeroMonths > 0 ? total / nonZeroMonths : 0;
                            }

                            if (avg > 0) {
                                return (
                                    <ReferenceLine
                                        y={avg}
                                        stroke="#fbbf24"
                                        strokeDasharray="3 3"
                                        label={{
                                            position: 'right',
                                            value: 'Avg',
                                            fill: '#fbbf24',
                                            fontSize: 10
                                        }}
                                    />
                                );
                            }
                            return null;
                        })()}
                        <Bar
                            dataKey="amount"
                            fill="url(#colorGradient)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
