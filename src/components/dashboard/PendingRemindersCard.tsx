"use client";

import { useState, useTransition } from "react";
import { MonthlyReminderItem } from "@/lib/types";
import { markReminderPaid, skipReminder } from "@/lib/actions/reminders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    SkipForward,
    DollarSign,
    Loader2,
    Sparkles
} from "lucide-react";
import { format } from "date-fns";

interface PendingRemindersCardProps {
    reminders: MonthlyReminderItem[];
    currency?: string;
    periodKey: string;
}

export function PendingRemindersCard({
    reminders,
    currency = 'INR',
    periodKey,
}: PendingRemindersCardProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'paid' | 'overdue'>('pending');
    const [selectedReminder, setSelectedReminder] = useState<MonthlyReminderItem | null>(null);
    const [confirmAmount, setConfirmAmount] = useState<string>('');
    const [confirmDate, setConfirmDate] = useState<string>('');
    const [isPendingAction, startTransition] = useTransition();

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
    });

    const pendingCount = reminders.filter(r => r.status === 'pending').length;
    const paidCount = reminders.filter(r => r.status === 'paid').length;
    const overdueCount = reminders.filter(r => r.daysOverdue !== undefined && r.daysOverdue > 0 && r.status === 'pending').length;

    const totalPendingExpenses = reminders
        .filter(r => r.status === 'pending' && r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);

    const filteredReminders = reminders.filter(item => {
        if (activeTab === 'pending') return item.status === 'pending';
        if (activeTab === 'paid') return item.status === 'paid';
        if (activeTab === 'overdue') return item.status === 'pending' && (item.daysOverdue || 0) > 0;
        return true;
    });

    const openMarkPaidModal = (reminder: MonthlyReminderItem) => {
        setSelectedReminder(reminder);
        setConfirmAmount(String(reminder.actualAmount || reminder.amount));
        setConfirmDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleConfirmMarkPaid = async () => {
        if (!selectedReminder) return;

        startTransition(async () => {
            const amount = Number(confirmAmount);
            await markReminderPaid(selectedReminder.reminderId, periodKey, isNaN(amount) ? selectedReminder.amount : amount, confirmDate);
            setSelectedReminder(null);
        });
    };

    const handleSkip = (reminder: MonthlyReminderItem) => {
        startTransition(async () => {
            await skipReminder(reminder.reminderId, periodKey);
        });
    };

    return (
        <Card className="glass-card w-full h-full flex flex-col overflow-hidden">
            <CardHeader className="shrink-0 pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg font-semibold flex flex-wrap items-center gap-2">
                            <span>Pending Reminders</span>
                            {pendingCount > 0 && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 whitespace-nowrap shrink-0 inline-flex items-center">
                                    {pendingCount} Pending
                                </span>
                            )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Expected monthly transactions to track and confirm
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-accent/40 p-1 rounded-lg border border-border/50 self-start sm:self-auto text-xs shrink-0">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeTab === 'pending' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Pending ({pendingCount})
                        </button>
                        {overdueCount > 0 && (
                            <button
                                onClick={() => setActiveTab('overdue')}
                                className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeTab === 'overdue' ? 'bg-destructive text-destructive-foreground shadow-sm' : 'text-destructive hover:bg-destructive/10'}`}
                            >
                                Overdue ({overdueCount})
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('paid')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeTab === 'paid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Paid ({paidCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            All ({reminders.length})
                        </button>
                    </div>
                </div>

                {/* Remaining pending total banner */}
                {totalPendingExpenses > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-medium text-amber-200">Total Pending Deductions:</span>
                        </div>
                        <span className="text-sm font-bold text-amber-300">{formatter.format(totalPendingExpenses)}</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[460px]">
                {filteredReminders.length === 0 ? (
                    <div className="py-8">
                        <EmptyState
                            title={activeTab === 'pending' ? 'No pending reminders!' : 'No items found'}
                            description={activeTab === 'pending' ? 'Great job! All expected transactions for this period are settled.' : 'No reminder items in this filter tab.'}
                        />
                    </div>
                ) : (
                    filteredReminders.map((item) => {
                        const isIncome = item.type === 'income';
                        const isOverdue = item.status === 'pending' && (item.daysOverdue || 0) > 0;
                        const isExpired = item.status === 'expired';
                        const isPaid = item.status === 'paid';
                        const isSkipped = item.status === 'skipped';

                        return (
                            <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    isPaid
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : isOverdue
                                        ? 'bg-destructive/10 border-destructive/30'
                                        : isExpired
                                        ? 'bg-muted/30 border-border/50 opacity-65'
                                        : isSkipped
                                        ? 'bg-muted/30 border-border/40'
                                        : 'bg-card/70 border-border/60 hover:border-primary/40'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2.5 rounded-xl shrink-0 ${isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
                                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 whitespace-nowrap">
                                                {item.category}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> Due {item.dueDate}
                                            </span>

                                            {isOverdue && (
                                                <span className="px-2 py-0.5 rounded-md bg-destructive/20 text-destructive text-[11px] font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Past due {item.daysOverdue}d (Auto-expires in {Math.max(0, 14 - (item.daysOverdue || 0))}d)
                                                </span>
                                            )}

                                            {isPaid && (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Paid on {item.paidDate || 'today'}
                                                </span>
                                            )}

                                            {isExpired && (
                                                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
                                                    Auto-Expired
                                                </span>
                                            )}

                                            {isSkipped && (
                                                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[11px] font-medium">
                                                    Skipped Month
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                                    <div className="text-right">
                                        <span className={`text-base font-bold ${isIncome ? 'text-emerald-400' : 'text-foreground'}`}>
                                            {isIncome ? '+' : '-'}{formatter.format(item.actualAmount || item.amount)}
                                        </span>
                                    </div>

                                    {(item.status === 'pending' || isOverdue) && (
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                size="sm"
                                                onClick={() => openMarkPaidModal(item)}
                                                disabled={isPendingAction}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-8 px-3"
                                            >
                                                Mark Paid
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleSkip(item)}
                                                disabled={isPendingAction}
                                                title="Skip for this month"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                            >
                                                <SkipForward className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>

            {/* Quick Confirm Modal */}
            <Modal
                isOpen={!!selectedReminder}
                onClose={() => setSelectedReminder(null)}
                title="Confirm Transaction"
            >
                {selectedReminder && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Confirm or adjust the final details before logging this as an actual transaction for <span className="font-semibold text-foreground">{selectedReminder.title}</span>.
                        </p>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Final Amount ({currency})</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={confirmAmount}
                                onChange={(e) => setConfirmAmount(e.target.value)}
                                placeholder="Enter amount"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Date</label>
                            <Input
                                type="date"
                                value={confirmDate}
                                onChange={(e) => setConfirmDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setSelectedReminder(null)} disabled={isPendingAction}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmMarkPaid} disabled={isPendingAction} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                                {isPendingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Confirm & Log Transaction
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
}
