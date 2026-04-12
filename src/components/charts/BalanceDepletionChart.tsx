"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";

type DailySpend = {
    _id: string; // Date string "YYYY-MM-DD"
    amount: number;
};

interface BalanceDepletionChartProps {
    data: DailySpend[];
    currentGlobalBalance: number;
    periodTotalExpenses: number;
    periodLabel: string;
    currency?: string;
}

const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length >= 2) {
        // payload[0] is typically 'remaining', payload[1] is 'spent'
        // Let's find them properly by dataKey
        const remainingObj = payload.find((p: any) => p.dataKey === 'remaining');
        const spentObj = payload.find((p: any) => p.dataKey === 'spent');
        
        return (
            <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
                <p className="font-semibold mb-2 text-foreground border-b border-border pb-1">
                    {payload[0].payload.displayDate}
                </p>
                {spentObj && (
                    <div className="flex justify-between gap-4 text-sm mt-1">
                        <span className="text-destructive">Cumulative Spent:</span>
                        <span className="font-medium">{formatter.format(spentObj.value)}</span>
                    </div>
                )}
                {remainingObj && (
                    <div className="flex justify-between gap-4 text-sm">
                        <span className="text-primary">Remaining Pool:</span>
                        <span className="font-medium">{formatter.format(remainingObj.value)}</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export function BalanceDepletionChart({ 
    data, 
    currentGlobalBalance, 
    periodTotalExpenses, 
    periodLabel, 
    currency = 'USD' 
}: BalanceDepletionChartProps) {
    const formatter = useMemo(() => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }), [currency]);

    // Calculate the constant starting pool for the period
    const startingPool = currentGlobalBalance + periodTotalExpenses;

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        let cumulativeSpent = 0;
        
        return data.map(day => {
            cumulativeSpent += day.amount;
            
            // Format date for display
            const dateObj = new Date(day._id);
            const displayDate = isNaN(dateObj.getTime()) ? day._id : format(dateObj, "MMM d");
            
            return {
                date: day._id,
                displayDate,
                spent: cumulativeSpent,
                remaining: Math.max(0, startingPool - cumulativeSpent), 
            };
        });
    }, [data, startingPool]);

    const hasData = chartData.length > 0;

    return (
        <Card className="glass-card w-full h-full min-h-[400px] flex flex-col overflow-hidden">
            <CardHeader className="shrink-0 pb-2">
                <CardTitle className="flex justify-between items-center text-lg font-medium">
                    <span>Balance Depletion</span>
                    <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase">Starting Pool</span>
                        <span className="font-medium text-foreground">{formatter.format(startingPool)}</span>
                    </div>
                    <div className="flex flex-col border-l pl-4 border-border">
                        <span className="text-xs uppercase">Period Spent</span>
                        <span className="font-medium text-destructive">{formatter.format(periodTotalExpenses)}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] pl-0">
                {!hasData ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        No transactions found for this period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                width={60}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                tickFormatter={(val) => formatter.format(val)}
                            />
                            <Tooltip 
                                content={<CustomTooltip formatter={formatter} />} 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                            />
                            <Legend 
                                iconType="circle" 
                                wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                            />
                            <Bar 
                                dataKey="remaining" 
                                stackId="a" 
                                fill="hsl(var(--primary) / 0.8)" 
                                radius={[0, 0, 4, 4]} 
                                name="Remaining Pool"
                                isAnimationActive={false}
                            />
                            <Bar 
                                dataKey="spent" 
                                stackId="a" 
                                fill="hsl(var(--destructive) / 0.8)" 
                                radius={[4, 4, 0, 0]} 
                                name="Cumulative Spent"
                                isAnimationActive={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
