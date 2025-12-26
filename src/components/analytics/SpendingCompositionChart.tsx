"use client";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/Card";
import { Transaction, RecurringRule } from "@/lib/types";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";

interface SpendingCompositionChartProps {
    transactions: Transaction[];
    recurringRules: RecurringRule[];
    formatAmount: (amount: number) => string;
}

export function SpendingCompositionChart({ transactions, recurringRules, formatAmount }: SpendingCompositionChartProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

    const data = useMemo(() => {
        const result = [];
        const currentYear = selectedDate.getFullYear();
        const currentMonth = selectedDate.getMonth();

        // Helper to process transactions for a given time range
        const processPeriod = (startDate: Date, endDate: Date, label: string) => {
            let income = 0;
            let expenses = 0;
            let savings = 0;

            transactions.forEach(t => {
                const tDate = new Date(t.date);
                if (tDate >= startDate && tDate <= endDate) {
                    if (t.type === 'income') {
                        income += t.amount;
                    } else if (t.type === 'expense') {
                        if (t.category.toLowerCase() === 'savings') {
                            savings += t.amount;
                        } else {
                            expenses += t.amount;
                        }
                    }
                }
            });

            // If income is 0, we can't show a % distribution of income correctly in a "100% of Income" chart.
            // But usually this chart shows % of TOTAL FLOW. 
            // If the user wants "Income vs Expenses vs Savings" % wise, 
            // a 100% stacked bar of (Savings + Expenses + Remaining) = Income makes sense.
            // Remaining = Income - (Savings + Expenses). If negative, Remaining = 0.

            const totalUsed = savings + expenses;
            const remaining = Math.max(0, income - totalUsed);

            // Avoid empty bars with 0 height if no activity
            if (income === 0 && expenses === 0 && savings === 0) {
                return { name: label, Savings: 0, Expenses: 0, Remaining: 0, income: 0 };
            }

            return {
                name: label,
                Savings: savings,
                Expenses: expenses,
                Remaining: remaining,
                income: income
            };
        };

        if (viewMode === 'year') {
            for (let i = 0; i < 12; i++) {
                const start = new Date(currentYear, i, 1);
                const end = new Date(currentYear, i + 1, 0, 23, 59, 59);
                result.push(processPeriod(start, end, start.toLocaleString('default', { month: 'short' })));
            }
        } else {
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const start = new Date(currentYear, currentMonth, i);
                const end = new Date(currentYear, currentMonth, i, 23, 59, 59);
                result.push(processPeriod(start, end, i.toString()));
            }
        }

        return result;
    }, [transactions, selectedDate, viewMode]);

    return (
        <Card className="glass-card p-4 sm:p-6 h-full flex flex-col overflow-hidden min-w-0">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Savings & Spending Distribution</h3>
                        <p className="text-sm text-muted-foreground">Income allocation: Savings vs Expenses vs Remaining.</p>
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
                    <BarChart data={data} stackOffset="expand" barSize={viewMode === 'year' ? 40 : 15}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={10} // Prevent overlap on month view
                        />
                        {/* Show percentage on Y Axis */}
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number, name: string, props: any) => {
                                // Calculate actual percentage based on income for tooltip
                                // props.payload.income gives total income for that bar
                                const income = props.payload.income;
                                const pct = income > 0 ? (value / income) * 100 : 0;
                                return [`${formatAmount(value)} (${pct.toFixed(1)}%)`, name];
                            }}
                            labelStyle={{ color: '#fff', marginBottom: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="Savings" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Expenses" stackId="a" fill="#ef4444" />
                        <Bar dataKey="Remaining" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
