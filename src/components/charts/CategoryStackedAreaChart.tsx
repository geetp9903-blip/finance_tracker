"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Filter, Layers, BarChart3, PieChart } from "lucide-react";
import { format } from "date-fns";

type CategoryTrendData = {
    date: string;
    category: string;
    amount: number;
};

type Props = {
    data: CategoryTrendData[];
    periodTotalExpenses: number;
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
];

export function CategoryStackedAreaChart({ data, periodTotalExpenses, currency = 'USD' }: Props) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [showOthers, setShowOthers] = useState<boolean>(false);
    
    // 1. Extract and Pivot Data
    const { chartData, categoryTotals } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], categoryTotals: {} as Record<string, number>, rawDaily: {} as Record<string, Record<string, number>>, sortedDates: [] as string[] };

        const totals: Record<string, number> = {};
        const dailyTransactions: Record<string, Record<string, number>> = {};
        const allDates = new Set<string>();

        // Find totals and group by date
        data.forEach(item => {
            totals[item.category] = (totals[item.category] || 0) + item.amount;
            
            if (!dailyTransactions[item.date]) {
                dailyTransactions[item.date] = {};
            }
            dailyTransactions[item.date][item.category] = (dailyTransactions[item.date][item.category] || 0) + item.amount;
            allDates.add(item.date);
        });

        // Sort dates chronologically
        const sortedDates = Array.from(allDates).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
        );

        // Calculate running totals for the cumulative effect
        const runningTotals: Record<string, number> = {};
        Object.keys(totals).forEach(cat => runningTotals[cat] = 0);

        const cumulativeData = sortedDates.map(date => {
            const dayData: any = { 
                date, 
                displayDate: format(new Date(date), "MMM d") 
            };
            
            // Add today's tx to running totals
            Object.keys(totals).forEach(cat => {
                if (dailyTransactions[date][cat]) {
                    runningTotals[cat] += dailyTransactions[date][cat];
                }
                dayData[cat] = runningTotals[cat];
            });
            
            return dayData;
        });

        return { chartData: cumulativeData, categoryTotals: totals, rawDaily: dailyTransactions, sortedDates };
    }, [data]);

    // Compute final data including "All Others" if needed
    const finalChartData = useMemo(() => {
        if (!showOthers) return chartData;
        
        return chartData.map(day => {
            const newDay = { ...day };
            let othersTotal = 0;
            
            Object.keys(categoryTotals).forEach(cat => {
                if (!selectedCategories.includes(cat)) {
                    // Accumulate from the pre-calculated running totals in chartData
                    othersTotal += day[cat] || 0;
                }
            });
            
            newDay['All Others'] = othersTotal;
            return newDay;
        });
    }, [chartData, showOthers, selectedCategories, categoryTotals]);

    // Calculate percentage based on selected categories (and others if enabled)
    const selectionPercentage = useMemo(() => {
        if (periodTotalExpenses === 0) return 0;
        let selectedSum = selectedCategories.reduce((sum, cat) => sum + (categoryTotals[cat] || 0), 0);
        
        if (showOthers) {
            Object.keys(categoryTotals).forEach(cat => {
                if (!selectedCategories.includes(cat)) {
                    selectedSum += (categoryTotals[cat] || 0);
                }
            });
        }
        
        return (selectedSum / periodTotalExpenses) * 100;
    }, [selectedCategories, categoryTotals, periodTotalExpenses, showOthers]);

    // 2. Select Top 5 by Default
    const selectTop5 = useCallback(() => {
        const sortedCats = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat]) => cat);
        setSelectedCategories(sortedCats);
    }, [categoryTotals]);

    useEffect(() => {
        if (Object.keys(categoryTotals).length > 0 && selectedCategories.length === 0) {
            selectTop5();
        }
    }, [categoryTotals, selectedCategories.length, selectTop5]);

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            if (selectedCategories.length >= 6) return; // Limit to 6 for readable chart
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
        <Card className="h-full min-h-[500px] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-4 shrink-0">
                <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Cumulative Spending Volume
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                        Track how specific categories accumulate over the period.
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="bg-secondary/30 border border-secondary px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Selection:</span>
                        <span className="font-semibold text-foreground">
                            {selectionPercentage.toFixed(1)}% of Total
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pl-4 pr-4">
                
                {/* Controls Area (Left/Top on mobile) */}
                <div className="w-full lg:w-48 shrink-0 flex flex-col gap-2 p-2 rounded-lg bg-secondary/10 border border-secondary/20 max-h-[300px] lg:max-h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                            <Filter className="h-3 w-3" /> Select up to 6
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectTop5}>
                            Auto Top
                        </Button>
                    </div>
                    {availableCategories.map(cat => (
                        <div
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={`
                                flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors select-none
                                ${selectedCategories.includes(cat) ? 'bg-primary/10 text-foreground font-medium' : 'hover:bg-accent text-muted-foreground'}
                                ${(!selectedCategories.includes(cat) && selectedCategories.length >= 6) ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <span className="truncate pr-2" title={cat}>{cat}</span>
                            {selectedCategories.includes(cat) && (
                                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[selectedCategories.indexOf(cat) % COLORS.length] }} />
                            )}
                        </div>
                    ))}

                    <div className="h-px w-full bg-border my-1" />
                    
                    <div
                        onClick={() => setShowOthers(!showOthers)}
                        className={`
                            flex items-center justify-between p-2 rounded cursor-pointer text-sm transition-colors select-none mt-1
                            ${showOthers ? 'bg-muted text-foreground font-medium border border-border' : 'hover:bg-accent text-muted-foreground'}
                        `}
                    >
                        <span className="truncate pr-2">All Others</span>
                        {showOthers && (
                            <div className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground" />
                        )}
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 w-full min-w-0 min-h-[300px]">
                    {finalChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No spending data to visualize.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={finalChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis 
                                    dataKey="displayDate" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(val) => formatter.format(val)} 
                                    width={60}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '13px', paddingTop: '2px', paddingBottom: '2px' }}
                                    labelStyle={{ color: '#aaa', marginBottom: '8px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}
                                    formatter={(val: number, name: string) => [formatter.format(val), name]}
                                />
                                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                                {selectedCategories.map((cat, index) => (
                                    <Area
                                        key={cat}
                                        type="monotone"
                                        dataKey={cat}
                                        stackId="1"
                                        stroke={COLORS[index % COLORS.length]}
                                        fill={COLORS[index % COLORS.length]}
                                        fillOpacity={0.6}
                                        strokeWidth={2}
                                        activeDot={{ r: 5, strokeWidth: 1 }}
                                        isAnimationActive={false}
                                    />
                                ))}
                                {showOthers && (
                                    <Area
                                        key="All Others"
                                        type="monotone"
                                        dataKey="All Others"
                                        stackId="1"
                                        stroke="#71717a"
                                        fill="#71717a"
                                        fillOpacity={0.4}
                                        strokeWidth={2}
                                        activeDot={{ r: 5, strokeWidth: 1 }}
                                        isAnimationActive={false}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
