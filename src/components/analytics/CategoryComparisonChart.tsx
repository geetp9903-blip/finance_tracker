"use client";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/Card";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";

interface CategoryComparisonChartProps {
    transactions: Transaction[];
    formatAmount: (amount: number) => string;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export function CategoryComparisonChart({ transactions, formatAmount }: CategoryComparisonChartProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'month' | 'year'>('year');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const uniqueCategories = useMemo(() =>
        Array.from(new Set(transactions.map(t => t.category))),
        [transactions]);

    const handleCategoryToggle = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(prev => prev.filter(c => c !== category));
        } else {
            if (selectedCategories.length < 5) {
                setSelectedCategories(prev => [...prev, category]);
            }
        }
    };

    const quickSelect = (mode: 'cost' | 'freq' | 'recent' | 'clear') => {
        if (mode === 'clear') {
            setSelectedCategories([]);
            return;
        }

        const stats = new Map<string, number>();
        transactions.forEach(t => {
            if (t.type !== 'expense') return;
            // Basic filtering for context (e.g. this year for cost/freq)
            const d = new Date(t.date);
            if (d.getFullYear() !== selectedDate.getFullYear()) return;

            if (mode === 'cost') {
                stats.set(t.category, (stats.get(t.category) || 0) + t.amount);
            } else if (mode === 'freq') {
                stats.set(t.category, (stats.get(t.category) || 0) + 1);
            }
        });

        // Recent logic is slightly different (just last used)
        if (mode === 'recent') {
            // simplified: just take unique categories from last 20 transactions
            const recent = Array.from(new Set(transactions.slice(0, 50).map(t => t.category))).slice(0, 5);
            setSelectedCategories(recent);
            return;
        }

        const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 5);
        setSelectedCategories(sorted);
    };

    const chartData = useMemo(() => {
        const data: any[] = [];

        if (viewMode === 'year') {
            for (let i = 0; i < 12; i++) {
                const date = new Date(selectedDate.getFullYear(), i, 1);
                const item: any = { name: date.toLocaleString('default', { month: 'short' }) };
                selectedCategories.forEach(c => item[c] = 0);
                data.push(item);
            }
        } else {
            const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const item: any = { name: i.toString() };
                selectedCategories.forEach(c => item[c] = 0);
                data.push(item);
            }
        }

        transactions.forEach(t => {
            if (t.type !== 'expense' || !selectedCategories.includes(t.category)) return;
            const d = new Date(t.date);

            let index = -1;
            if (viewMode === 'year' && d.getFullYear() === selectedDate.getFullYear()) {
                index = d.getMonth();
            } else if (viewMode === 'month' && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()) {
                index = d.getDate() - 1;
            }

            if (index !== -1 && data[index]) {
                data[index][t.category] += t.amount;
            }
        });

        return data;
    }, [transactions, selectedCategories, viewMode, selectedDate]);

    return (
        <Card className="glass-card p-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Category Comparison</h3>
                        <p className="text-sm text-muted-foreground">Compare up to 5 categories ({selectedCategories.length}/5)</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('year')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                viewMode === 'year' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Year View
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                viewMode === 'month' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Month View
                        </button>
                    </div>

                    {/* Date Selector */}
                    <div className="flex items-center gap-2">
                        {viewMode === 'year' ? (
                            <select
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors"
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
                            <input
                                type="month"
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors dark:[color-scheme:dark]"
                                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSelectedDate(new Date(e.target.value));
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Quick Selects & Toggles */}
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground self-center mr-2">Quick Select:</span>
                        <button onClick={() => quickSelect('cost')} className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">Top Cost</button>
                        <button onClick={() => quickSelect('freq')} className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">Top Freq</button>
                        <button onClick={() => quickSelect('recent')} className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">Recent</button>
                        <button onClick={() => quickSelect('clear')} className="text-xs px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 rounded-lg transition-colors">Clear</button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {uniqueCategories.map(c => (
                            <button
                                key={c}
                                onClick={() => handleCategoryToggle(c)}
                                disabled={!selectedCategories.includes(c) && selectedCategories.length >= 5}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1",
                                    selectedCategories.includes(c)
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {c}
                                {selectedCategories.includes(c) && <Check className="h-3 w-3" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {selectedCategories.map((c, i) => (
                            <Line
                                key={c}
                                type="monotone"
                                dataKey={c}
                                stroke={COLORS[i % COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
