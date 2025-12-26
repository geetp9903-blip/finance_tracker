"use client";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from "recharts";
import { Card } from "@/components/ui/Card";
import { Transaction, Budget } from "@/lib/types";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";

interface BudgetBurndownChartProps {
    transactions: Transaction[];
    budget: Budget;
    formatAmount: (amount: number) => string;
}

export function BudgetBurndownChart({ transactions, budget, formatAmount }: BudgetBurndownChartProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const totalBudget = useMemo(() => {
        const fixedTotal = budget.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
        // Assuming allocations are amounts, not percentages (or we need income to calc). 
        // Checking types.ts: Allocation has 'percentage', not amount?
        // Wait, types.ts says: export interface Allocation { percentage: number; ... }
        // If allocations are percentages, we can't easily know the absolute "Total Budget" without Total Income.
        // Let's assume we can calculate it relative to Income or if 'entries' exist?
        // Actually, if we use Income as the basis: Total Budget = Income.
        // But usually people have a number in mind.
        // Let's rely on "Expected Income" if available? 
        // For now, let's Sum Fixed Expenses + (Average Income * Allocation%)?
        // Or simpler: Use "Income" of the current month as the Limit?
        // "Budget Burndown" usually implies a Limit.
        // Let's fallback: If no explicit budget limit, maybe this chart shouldn't resolve?
        // Plan said "Conditional Render: budget > 0".
        // Let's assume Total Budget = Sum of Fixed Expenses + (Sum of Income * Sum of Allocations / 100)?

        // Let's try to find an absolute number.
        // Maybe we just use Total Income of the month as the "Limit"?
        // Or entries? BudgetEntry has amount.
        const entriesTotal = budget.entries ? budget.entries.reduce((sum, e) => sum + e.amount, 0) : 0;
        return fixedTotal + entriesTotal;
    }, [budget]);

    // If budget is determined by percentage of income, we need dynamic calculation.
    // Let's use Actual Income of the month * Allocation % as the "Variable Budget".
    const monthlyIncome = useMemo(() => {
        return transactions
            .filter(t => t.type === 'income' &&
                new Date(t.date).getMonth() === selectedDate.getMonth() &&
                new Date(t.date).getFullYear() === selectedDate.getFullYear())
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, selectedDate]);

    const calculatedBudget = useMemo(() => {
        const fixedTotal = budget.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
        const variableTotal = budget.allocations.reduce((sum, item) => sum + (monthlyIncome * (item.percentage / 100)), 0);
        return fixedTotal + variableTotal;
    }, [budget, monthlyIncome]);


    const chartData = useMemo(() => {
        if (calculatedBudget <= 0) return [];

        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
        const data = [];
        let cumulativeSpend = 0;

        const today = new Date();
        const isCurrentMonth = today.getMonth() === selectedDate.getMonth() && today.getFullYear() === selectedDate.getFullYear();
        const currentDay = today.getDate();

        // Filter expenses
        const expenses = transactions.filter(t =>
            t.type === 'expense' &&
            new Date(t.date).getMonth() === selectedDate.getMonth() &&
            new Date(t.date).getFullYear() === selectedDate.getFullYear()
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (let day = 1; day <= daysInMonth; day++) {
            // Ideal Pace (Linear)
            const ideal = (calculatedBudget / daysInMonth) * day;

            // Actual Spend
            // Find expenses on this day
            const daysExpenses = expenses.filter(t => new Date(t.date).getDate() === day);
            const dayTotal = daysExpenses.reduce((sum, t) => sum + t.amount, 0);
            cumulativeSpend += dayTotal;

            // Don't plot future days for Actual
            if (isCurrentMonth && day > currentDay) {
                data.push({
                    day,
                    ideal
                });
            } else {
                data.push({
                    day,
                    ideal,
                    actual: cumulativeSpend
                });
            }
        }
        return data;
    }, [transactions, calculatedBudget, selectedDate]);

    if (calculatedBudget <= 0) {
        return null;
    }

    return (
        <Card className="glass-card p-6 h-full flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Budget Pace</h3>
                    <p className="text-sm text-muted-foreground">Are you spending faster than you should?</p>
                </div>
                <MonthYearPicker selectedDate={selectedDate} onChange={setSelectedDate} />
            </div>

            <div className="flex-1 min-h-0 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => formatAmount(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="ideal" stroke="#888888" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Safe Pace" />
                        <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Actual Spend" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">
                Target Budget: {formatAmount(calculatedBudget)}
            </div>
        </Card>
    );
}
