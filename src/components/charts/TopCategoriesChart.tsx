"use client";

import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface TopCategoriesChartProps {
    data: { category: string; value: number }[];
    currency?: string;
}

const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-2 rounded-lg shadow-xl backdrop-blur-md">
                <p className="font-semibold mb-1 text-foreground">{payload[0].payload.category}</p>
                <p className="text-primary font-bold">
                    {formatter.format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export function TopCategoriesChart({ data, currency = 'USD' }: TopCategoriesChartProps) {
    const formatter = useMemo(() => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }), [currency]);

    const hasData = data && data.length > 0;

    const chartContent = useMemo(() => {
        if (!hasData) {
            return (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    No category data available.
                </div>
            );
        }

        return (
            <div className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            type="number"
                            tickFormatter={(val) => formatter.format(val)}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            dataKey="category"
                            type="category"
                            width={100}
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            content={<CustomTooltip formatter={formatter} />}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            animationDuration={200}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                            isAnimationActive={false} // Performance
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }, [data, formatter, hasData]);

    return (
        <Card className="glass-card w-full h-full min-h-[400px] flex flex-col">
            <CardHeader className="shrink-0">
                <CardTitle className="text-lg font-medium">Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {chartContent}
            </CardContent>
        </Card>
    );
}
