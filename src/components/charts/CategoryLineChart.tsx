"use client";

import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";


import { Filter, TrendingUp, BarChart3 } from "lucide-react";

type CategoryTrendData = {
    date: string;
    category: string;
    amount: number;
};

type Props = {
    data: CategoryTrendData[];
    currency?: string;
};

const COLORS = [
    '#2563eb', // Blue
    '#16a34a', // Green
    '#dc2626', // Red
    '#d97706', // Amber
    '#9333ea', // Purple
    '#0891b2', // Cyan
    '#db2777', // Pink
    '#65a30d', // Lime
    '#4b5563', // Gray
    '#0f172a', // Slate
];

export function CategoryLineChart({ data, currency = 'USD' }: Props) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [allCategories, setAllCategories] = useState<string[]>([]);

    // 1. Pivot Data & Find Totals
    const { chartData, categoryTotals } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], categoryTotals: {} };

        const cats = new Set<string>();
        const totals: Record<string, number> = {};
        const dateMap: Record<string, any> = {};

        data.forEach(item => {
            cats.add(item.category);
            totals[item.category] = (totals[item.category] || 0) + item.amount;

            if (!dateMap[item.date]) {
                dateMap[item.date] = { date: item.date };
            }
            dateMap[item.date][item.category] = item.amount;
        });

        const sortedData = Object.values(dateMap).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return { chartData: sortedData, categoryTotals: totals };
    }, [data]);

    // 2. Initialize with Top 5 on load
    useEffect(() => {
        if (Object.keys(categoryTotals).length > 0 && selectedCategories.length === 0) {
            selectTop5();
        }
    }, [categoryTotals]);

    // Helper: Select Top 5 by Amount
    const selectTop5 = () => {
        const sortedCats = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat]) => cat);
        setSelectedCategories(sortedCats);
    };

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            if (selectedCategories.length >= 5) {
                // Optional: Alert max 5 or just replace last? Let's strictly limit for clarity
                return;
            }
            setSelectedCategories(prev => [...prev, cat]);
        }
    };

    const availableCategories = Object.keys(categoryTotals).sort();

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return (
        <Card className="h-full min-h-[500px] flex flex-col">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-4">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Category Trends
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Compare spending across categories over time.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectTop5}>
                        <BarChart3 className="mr-2 h-4 w-4" /> Top 5
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategories([])}>
                        Clear
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col lg:flex-row gap-6">

                {/* Controls Area (Left/Top on mobile) */}
                <div className="w-full lg:w-48 shrink-0 flex flex-col gap-2 p-2 rounded-lg bg-secondary/10 border border-secondary/20 max-h-[300px] lg:max-h-[400px] overflow-y-auto">
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                        <Filter className="h-3 w-3" /> Select up to 5
                    </div>
                    {availableCategories.map(cat => (
                        <div
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`
                                flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors select-none
                                ${selectedCategories.includes(cat) ? 'bg-primary/10 text-foreground font-medium' : 'hover:bg-accent text-muted-foreground'}
                                ${(!selectedCategories.includes(cat) && selectedCategories.length >= 5) ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <span className="truncate" title={cat}>{cat}</span>
                            {selectedCategories.includes(cat) && (
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[selectedCategories.indexOf(cat) % COLORS.length] }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 h-[400px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => new Date(val).toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => formatter.format(val)}
                                width={60}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(20, 20, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '12px' }}
                                labelStyle={{ color: '#aaa', marginBottom: '5px' }}
                                formatter={(val: number) => formatter.format(val)}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            {selectedCategories.map((cat, index) => (
                                <Line
                                    key={cat}
                                    type="monotone"
                                    dataKey={cat}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3, strokeWidth: 1 }}
                                    activeDot={{ r: 5, strokeWidth: 2 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

