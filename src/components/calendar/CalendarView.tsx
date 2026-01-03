"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, getDay, getDaysInMonth, isSameDay } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type CalendarEvent = {
    id: string;
    date: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
};

export function CalendarView({
    date,
    events
}: {
    date: Date;
    events: CalendarEvent[];
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Navigation
    const handleMonthChange = (offset: number) => {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + offset);

        const params = new URLSearchParams(searchParams);
        params.set('month', (newDate.getMonth() + 1).toString());
        params.set('year', newDate.getFullYear().toString());

        router.replace(`${pathname}?${params.toString()}`);
    };

    // Grid Calculation
    const startDay = getDay(startOfMonth(date)); // 0 = Sunday
    const totalDays = getDaysInMonth(date);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight">
                    {format(date, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                {/* Day Labels */}
                <div className="grid grid-cols-7 mb-4 text-center text-sm font-medium text-muted-foreground">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-2 md:gap-4 auto-rows-[100px]">
                    {blanks.map((b) => (
                        <div key={`blank-${b}`} className="hidden md:block" />
                    ))}

                    {days.map((day) => {
                        const currentDayDate = new Date(date.getFullYear(), date.getMonth(), day);
                        const dayEvents = events.filter(e => isSameDay(new Date(e.date), currentDayDate));

                        const totalExpense = dayEvents
                            .filter(e => e.type === 'expense')
                            .reduce((sum, e) => sum + e.amount, 0);

                        const totalIncome = dayEvents
                            .filter(e => e.type === 'income')
                            .reduce((sum, e) => sum + e.amount, 0);

                        return (
                            <motion.div
                                key={day}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="border rounded-lg p-2 flex flex-col justify-between hover:bg-secondary/50 transition-colors relative group overflow-hidden"
                            >
                                <span className="text-sm font-medium text-muted-foreground">{day}</span>

                                <div className="space-y-1 text-xs">
                                    {totalIncome > 0 && (
                                        <div className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full w-full truncate font-medium">
                                            +{totalIncome.toFixed(0)}
                                        </div>
                                    )}
                                    {totalExpense > 0 && (
                                        <div className="bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full w-full truncate font-medium">
                                            -{totalExpense.toFixed(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Hover Detail - Simple representation */}
                                {dayEvents.length > 0 && (
                                    <div className="absolute inset-0 bg-background/95 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-center text-xs space-y-1 z-10 border border-transparent group-hover:border-primary/20 rounded-lg">
                                        <span className="font-bold text-foreground">{dayEvents.length} items</span>
                                        {totalExpense > 0 && <span className="text-red-500">Exp: {totalExpense.toFixed(0)}</span>}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
