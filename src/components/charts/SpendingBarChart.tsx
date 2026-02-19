"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useMemo } from "react";

type ChartDataPoint = {
    label: string;
    value: number;
    count: number;
};

interface SpendingBarChartProps {
    data: ChartDataPoint[];
    periodLabel: string; // "January 2026" or "2026"
    currency?: string;
    budget?: number; // Optional budget limit for visual comparison
}

const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-2 rounded-lg shadow-xl backdrop-blur-md">
                <p className="font-semibold mb-1 text-foreground">{payload[0].payload.label}</p>
                <p className="text-primary font-bold">
                    {formatter.format(payload[0].value)}
                </p>
                <p className="text-xs text-muted-foreground">
                    {payload[0].payload.count} transactions
                </p>
            </div>
        );
    }
    return null;
};

export function SpendingBarChart({ data, periodLabel, currency = 'USD', budget = 2500 }: SpendingBarChartProps) {
    const formatter = useMemo(() => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }), [currency]);

    const hasData = data && data.length > 0;

    // Memoize the chart logic to prevent re-calculations during re-renders
    const chartContent = useMemo(() => {
        if (!hasData) {
            return (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No spending data for this period.
                </div>
            );
        }

        return (
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="label"
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
                            animationDuration={200}
                        />
                        {/* Budget Line */}
                        <ReferenceLine
                            y={budget}
                            stroke="hsl(var(--destructive))"
                            strokeDasharray="3 3"
                            opacity={0.5}
                            label={{ position: 'right', value: 'Budget', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                        />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                            isAnimationActive={false} // Performance: Disable animation for instant paint
                        >
                            {data.map((entry, index) => {
                                const isOverBudget = entry.value > budget;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isOverBudget ? "hsl(var(--destructive) / 0.8)" : "hsl(var(--primary) / 0.8)"}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }, [data, formatter, budget, hasData]);

    return (
        <Card className="glass-card w-full h-full min-h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg font-medium">
                    <span>Spending Analysis</span>
                    <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {chartContent}
            </CardContent>
        </Card>
    );
}
