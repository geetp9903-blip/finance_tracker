"use client";

import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp, TrendingDown, Clock, ShieldCheck } from "lucide-react";

interface PredictiveChartPoint {
    date: string;
    displayDate: string;
    actual: number | null;
    projected: number | null;
    pendingExpenses: number;
    pendingIncome: number;
}

interface PredictiveBalanceChartProps {
    data: PredictiveChartPoint[];
    currentBalance: number;
    totalPaidExpenses: number;
    totalPendingExpenses: number;
    totalPendingIncome: number;
    periodLabel: string;
    currency?: string;
}

const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length > 0) {
        const dataPoint: PredictiveChartPoint = payload[0].payload;
        const actualVal = dataPoint.actual;
        const projectedVal = dataPoint.projected;

        return (
            <div className="bg-card border border-border p-3.5 rounded-xl shadow-xl backdrop-blur-md min-w-[200px]">
                <p className="font-semibold mb-2 text-foreground border-b border-border pb-1 text-sm">
                    {dataPoint.displayDate} ({dataPoint.date})
                </p>

                {actualVal !== null && (
                    <div className="flex justify-between items-center gap-4 text-xs mt-1">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                            Actual Balance:
                        </span>
                        <span className="font-bold text-foreground">{formatter.format(actualVal)}</span>
                    </div>
                )}

                {projectedVal !== null && (
                    <div className="flex justify-between items-center gap-4 text-xs mt-1">
                        <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                            Projected Trajectory:
                        </span>
                        <span className="font-bold text-foreground">{formatter.format(projectedVal)}</span>
                    </div>
                )}

                {dataPoint.pendingExpenses > 0 && (
                    <div className="flex justify-between items-center gap-4 text-xs mt-2 pt-1 border-t border-border/50 text-destructive">
                        <span>Pending Expense:</span>
                        <span className="font-semibold">-{formatter.format(dataPoint.pendingExpenses)}</span>
                    </div>
                )}

                {dataPoint.pendingIncome > 0 && (
                    <div className="flex justify-between items-center gap-4 text-xs mt-1 text-emerald-400">
                        <span>Pending Income:</span>
                        <span className="font-semibold">+{formatter.format(dataPoint.pendingIncome)}</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export function PredictiveBalanceChart({
    data,
    currentBalance,
    totalPaidExpenses,
    totalPendingExpenses,
    totalPendingIncome,
    periodLabel,
    currency = 'INR'
}: PredictiveBalanceChartProps) {
    const formatter = useMemo(() => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }), [currency]);

    const hasData = data && data.length > 0;

    return (
        <Card className="glass-card w-full h-full min-h-[420px] flex flex-col overflow-hidden">
            <CardHeader className="shrink-0 pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <span>Cashflow Forecast</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                                Dual Series
                            </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Actual history vs. projected cashflow after pending transactions
                        </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-accent/50 px-2.5 py-1 rounded-md self-start sm:self-auto">
                        {periodLabel}
                    </span>
                </div>

                {/* Stat pills summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="p-2.5 rounded-lg bg-accent/30 border border-border/50">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Current Balance
                        </span>
                        <p className="text-sm font-bold text-foreground mt-0.5">{formatter.format(currentBalance)}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-accent/30 border border-border/50">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-destructive" /> Paid Expenses
                        </span>
                        <p className="text-sm font-bold text-destructive mt-0.5">{formatter.format(totalPaidExpenses)}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-accent/30 border border-border/50">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> Pending Expenses
                        </span>
                        <p className="text-sm font-bold text-amber-400 mt-0.5">{formatter.format(totalPendingExpenses)}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-accent/30 border border-border/50">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-400" /> Pending Income
                        </span>
                        <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatter.format(totalPendingIncome)}</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-[320px] pt-4 pl-0 flex flex-col justify-between">
                {!hasData ? (
                    <div className="h-full flex items-center justify-center p-4">
                        <EmptyState
                            title="No transaction forecast"
                            description="Add transactions or set up reminders to see your projected cashflow balance."
                        />
                    </div>
                ) : (
                    <div className="w-full h-[280px] sm:h-[320px] min-h-[260px] relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis
                                    width={65}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                    tickFormatter={(val) => formatter.format(val)}
                                />
                                <Tooltip content={<CustomTooltip formatter={formatter} />} />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                />

                                {/* Actual Balance Series: Solid Line */}
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    name="Actual Balance (History)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', r: 3.5 }}
                                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                    connectNulls={true}
                                    isAnimationActive={false}
                                />

                                {/* Projected Balance Series: Dashed Line */}
                                <Line
                                    type="monotone"
                                    dataKey="projected"
                                    name="Projected Balance (Future)"
                                    stroke="#38bdf8"
                                    strokeWidth={3}
                                    strokeDasharray="6 6"
                                    dot={{ fill: '#38bdf8', r: 3 }}
                                    activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 2 }}
                                    connectNulls={true}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
