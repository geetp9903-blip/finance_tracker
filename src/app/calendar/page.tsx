"use client";
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useFinance } from "@/context/FinanceContext";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import 'react-calendar/dist/Calendar.css';
import './calendar-custom.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface RecurringRule {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    frequency: string;
    nextDueDate: string;
    active: boolean;
}

export default function CalendarPage() {
    const { transactions, formatAmount } = useFinance();
    const [date, setDate] = useState<Value>(new Date());
    const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);

    useEffect(() => {
        fetchRecurringRules();
    }, []);

    const fetchRecurringRules = async () => {
        try {
            const res = await fetch('/api/recurring', { cache: 'no-store' });
            const data = await res.json();
            if (data.rules) setRecurringRules(data.rules);
        } catch (error) {
            console.error('Failed to fetch recurring rules:', error);
        }
    };

    const getTileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view !== 'month') return null;

        const dateStr = date.toDateString();
        const hasTransaction = transactions.some(t => new Date(t.date).toDateString() === dateStr);
        const hasPending = recurringRules.some(r => r.active && new Date(r.nextDueDate).toDateString() === dateStr);

        if (!hasTransaction && !hasPending) return null;

        return (
            <div className="flex justify-center mt-1 gap-1">
                {hasTransaction && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {hasPending && <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />}
            </div>
        );
    };

    // Derived state for the selected date
    const selectedDate = date instanceof Date ? date : new Date();

    const selectedDateTransactions = transactions.filter(t =>
        new Date(t.date).toDateString() === selectedDate.toDateString()
    );

    const selectedDatePendingRules = recurringRules.filter(r =>
        r.active && new Date(r.nextDueDate).toDateString() === selectedDate.toDateString()
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Calendar</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-6">
                    <Calendar
                        onChange={setDate}
                        value={date}
                        tileContent={getTileContent}
                        className="w-full bg-transparent border-none text-white"
                    />
                </Card>

                <Card className="p-6 h-fit">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {selectedDate.toDateString()}
                    </h2>

                    <div className="space-y-4">
                        {/* Actual Transactions */}
                        {selectedDateTransactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div>
                                    <p className="font-medium text-white">{t.description}</p>
                                    <p className="text-xs text-white/50">{t.category}</p>
                                </div>
                                <span className={cn("font-semibold", t.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                                    {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                                </span>
                            </div>
                        ))}

                        {/* Pending Recurring Expenses */}
                        {selectedDatePendingRules.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 border-dashed">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-white/40" />
                                    <div>
                                        <p className="font-medium text-white/80">{r.description}</p>
                                        <p className="text-xs text-white/40">{r.category} • Pending</p>
                                    </div>
                                </div>
                                <span className={cn("font-semibold opacity-60", r.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                                    {r.type === 'income' ? '+' : '-'}{formatAmount(r.amount)}
                                </span>
                            </div>
                        ))}

                        {selectedDateTransactions.length === 0 && selectedDatePendingRules.length === 0 && (
                            <p className="text-center text-white/40 py-8">No transactions or pending items on this day</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
