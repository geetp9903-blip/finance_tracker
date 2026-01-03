"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

type CategoryData = {
    category: string;
    total: number;
};

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
    '#A28DFF', '#FF6B6B', '#4ECDC4', '#556270'
];

export function CategoryPieChart({ data, currency = 'USD' }: { data: CategoryData[], currency?: string }) {

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // 1. Sort by value descending
        const sorted = [...data].sort((a, b) => b.total - a.total);

        // 2. Take top 7
        if (sorted.length <= 7) return sorted;

        const top7 = sorted.slice(0, 7);
        const others = sorted.slice(7);

        // 3. Aggregate others
        const otherTotal = others.reduce((sum, item) => sum + item.total, 0);

        return [
            ...top7,
            { category: 'Other', total: otherTotal }
        ];
    }, [data]);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={processedData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="total"
                            nameKey="category"
                        >
                            {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => formatter.format(value)}
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
