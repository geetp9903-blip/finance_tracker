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

const truncate = (str: string, length: number) => {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};

export function CategoryComparisonChart({ transactions, formatAmount }: CategoryComparisonChartProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCumulative, setIsCumulative] = useState(false);

    const uniqueCategories = useMemo(() =>
        Array.from(new Set(transactions.map(t => t.category))),
        [transactions]);

    // Comparison Chart Default: Top Cost on Mount
    useMemo(() => {
        if (transactions.length > 0 && selectedCategories.length === 0) {
            const stats = new Map<string, number>();
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            transactions.forEach(t => {
                const d = new Date(t.date);
                if (t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    stats.set(t.category, (stats.get(t.category) || 0) + t.amount);
                }
            });

            const topCategories = Array.from(stats.entries())
                .sort((a, b) => b[1] - a[1])
                .map(e => e[0])
                .slice(0, 5);

            if (topCategories.length > 0) {
                setSelectedCategories(topCategories);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions]); // Only run when transactions load initially

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

        if (isCumulative) {
            const runningTotals: { [key: string]: number } = {};
            selectedCategories.forEach(c => runningTotals[c] = 0);

            data.forEach(item => {
                selectedCategories.forEach(c => {
                    runningTotals[c] += item[c];
                    item[c] = runningTotals[c];
                });
            });
        }

        return data;
    }, [transactions, selectedCategories, viewMode, selectedDate, isCumulative]);

    return (
        <Card className="glass-card p-4 sm:p-6 h-full flex flex-col overflow-hidden min-w-0">
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                            <button
                                onClick={() => setViewMode('year')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                                    viewMode === 'year' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Year
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                                    viewMode === 'month' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Month
                            </button>
                        </div>

                        <button
                            onClick={() => setIsCumulative(!isCumulative)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-full transition-all border",
                                isCumulative
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                            )}
                        >
                            Cumulative
                        </button>
                    </div>

                    {/* Date Selector */}
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
                            <input
                                type="month"
                                className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors dark:[color-scheme:dark] cursor-pointer"
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
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">Quick Select:</span>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => quickSelect('cost')} className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs">Top Cost</button>
                    <button onClick={() => quickSelect('freq')} className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs">Top Freq</button>
                    <button onClick={() => quickSelect('recent')} className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs">Recent</button>
                    <button onClick={() => { setSelectedCategories([]); }} className="px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-xs">Clear</button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2 max-h-[100px] overflow-y-auto min-h-[40px]">
                {uniqueCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs border transition-all truncate max-w-[150px]",
                            selectedCategories.includes(cat)
                                ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                        )}
                        title={cat}
                    >
                        {cat} {selectedCategories.includes(cat) && "✓"}
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 w-full mt-4 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => truncate(val, 5)}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [formatAmount(value), '']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {selectedCategories.map((cat, index) => (
                            <Line
                                key={cat}
                                type="monotone"
                                dataKey={cat}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                                animationDuration={1000}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
