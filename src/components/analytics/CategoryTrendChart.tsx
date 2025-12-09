"use client";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { Transaction } from "@/lib/types";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { cn } from "@/lib/utils";

interface CategoryTrendChartProps {
    transactions: Transaction[];
    formatAmount: (amount: number) => string;
}

export function CategoryTrendChart({ transactions, formatAmount }: CategoryTrendChartProps) {
    const [selectedCategory, setSelectedCategory] = useState("Food"); // Default
    const [viewMode, setViewMode] = useState<'month' | 'year'>('year');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const uniqueCategories = useMemo(() =>
        Array.from(new Set(transactions.map(t => t.category))),
        [transactions]);

    const chartData = useMemo(() => {
        const dataMap = new Map<string, number>();

        // Initialize keys
        if (viewMode === 'year') {
            for (let i = 0; i < 12; i++) {
                const date = new Date(selectedDate.getFullYear(), i, 1);
                dataMap.set(date.toLocaleString('default', { month: 'short' }), 0);
            }
        } else {
            const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                dataMap.set(i.toString(), 0);
            }
        }

        transactions.forEach(t => {
            if (t.type !== 'expense' || t.category !== selectedCategory) return;
            const d = new Date(t.date);

            let key = "";
            if (viewMode === 'year' && d.getFullYear() === selectedDate.getFullYear()) {
                key = d.toLocaleString('default', { month: 'short' });
            } else if (viewMode === 'month' && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()) {
                key = d.getDate().toString();
            }

            if (key && dataMap.has(key)) {
                dataMap.set(key, (dataMap.get(key) || 0) + t.amount);
            }
        });

        return Array.from(dataMap.entries()).map(([name, amount]) => ({ name, amount }));
    }, [transactions, selectedCategory, viewMode, selectedDate]);

    return (
        <Card className="glass-card p-6 h-full flex flex-col">
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
                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn("px-2 py-0.5 rounded-lg text-xs transition-colors", viewMode === 'month' ? "bg-primary text-white" : "text-muted-foreground")}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setViewMode('year')}
                                className={cn("px-2 py-0.5 rounded-lg text-xs transition-colors", viewMode === 'year' ? "bg-primary text-white" : "text-muted-foreground")}
                            >
                                Year
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
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
