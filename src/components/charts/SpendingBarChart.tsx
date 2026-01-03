"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
}

export function SpendingBarChart({ data, periodLabel, currency = 'USD' }: SpendingBarChartProps) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    });

    const hasData = data.length > 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-2 rounded-lg shadow-xl">
                    <p className="font-semibold mb-1">{label}</p>
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

    return (
        <Card className="glass-card w-full h-full min-h-[400px]">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg font-medium">
                    <span>Spending Analysis</span>
                    <span className="text-sm font-normal text-muted-foreground">{periodLabel}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    width={60}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                    tickFormatter={(val) => formatter.format(val)}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.7)"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No spending data for this period.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
