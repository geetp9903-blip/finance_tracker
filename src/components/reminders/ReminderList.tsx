"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TransactionReminder } from "@/lib/types";
import { updateReminderTemplate, deleteReminderTemplate } from "@/lib/actions/reminders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { Trash2, Edit2, ArrowUpRight, ArrowDownRight, Calendar, Loader2 } from "lucide-react";

interface ReminderListProps {
    reminders: TransactionReminder[];
    currency?: string;
}

export function ReminderList({ reminders, currency = 'INR' }: ReminderListProps) {
    const router = useRouter();
    const [editingReminder, setEditingReminder] = useState<TransactionReminder | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editDueDay, setEditDueDay] = useState("1");
    const [editCategory, setEditCategory] = useState("Subscription");
    const [editType, setEditType] = useState<'income' | 'expense'>('expense');

    const [isPending, startTransition] = useTransition();

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    });

    const openEditModal = (reminder: TransactionReminder) => {
        setEditingReminder(reminder);
        setEditTitle(reminder.title);
        setEditAmount(String(reminder.amount));
        setEditDueDay(String(reminder.dueDay || 1));
        setEditCategory(reminder.category || 'Subscription');
        setEditType(reminder.type || 'expense');
    };

    const handleSaveEdit = () => {
        if (!editingReminder) return;

        startTransition(async () => {
            await updateReminderTemplate(editingReminder.id, {
                title: editTitle,
                amount: Number(editAmount),
                dueDay: Number(editDueDay),
                category: editCategory,
                type: editType,
            });
            setEditingReminder(null);
            router.refresh();
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this reminder template?")) return;

        startTransition(async () => {
            await deleteReminderTemplate(id);
            router.refresh();
        });
    };

    const handleToggleActive = (reminder: TransactionReminder) => {
        startTransition(async () => {
            await updateReminderTemplate(reminder.id, {
                title: reminder.title,
                amount: reminder.amount,
                dueDay: reminder.dueDay,
                category: reminder.category,
                type: reminder.type,
                active: !reminder.active,
            });
            router.refresh();
        });
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <span>Active Reminder Templates ({reminders.length})</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {reminders.length === 0 ? (
                    <EmptyState
                        title="No reminder templates"
                        description="You haven't set up any recurring reminder templates yet. Create one on the left to start tracking pending monthly transactions."
                    />
                ) : (
                    reminders.map((reminder) => {
                        const isIncome = reminder.type === 'income';

                        return (
                            <div
                                key={reminder.id}
                                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                                    reminder.active ? 'bg-card/60 border-border/60' : 'bg-muted/20 border-border/40 opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`p-2.5 rounded-xl ${isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
                                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-foreground text-sm">{reminder.title}</h4>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 whitespace-nowrap">
                                                {reminder.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> Due day {reminder.dueDay} of month
                                            </span>
                                            <span className="capitalize">{reminder.frequency}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className={`text-base font-bold ${isIncome ? 'text-emerald-400' : 'text-foreground'}`}>
                                            {isIncome ? '+' : '-'}{formatter.format(reminder.amount)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleActive(reminder)}
                                            disabled={isPending}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            {reminder.active ? 'Active' : 'Paused'}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditModal(reminder)}
                                            disabled={isPending}
                                            className="h-8 w-8 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
                                            title="Edit Reminder"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(reminder.id)}
                                            disabled={isPending}
                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                            title="Delete Reminder"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingReminder}
                onClose={() => setEditingReminder(null)}
                title="Edit Reminder Template"
            >
                {editingReminder && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title / Description</label>
                            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Expected Amount</label>
                            <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Day of Month (1-31)</label>
                                <Input type="number" min="1" max="31" value={editDueDay} onChange={(e) => setEditDueDay(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value as 'income' | 'expense')}
                                    className="bg-background w-full rounded-md border border-input p-2.5 text-sm text-foreground"
                                >
                                    <option value="expense">Expense (-)</option>
                                    <option value="income">Income (+)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                            <CategorySelector
                                value={editCategory}
                                onChange={setEditCategory}
                                existingCategories={[]}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                            <Button variant="ghost" onClick={() => setEditingReminder(null)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveEdit} disabled={isPending} className="bg-primary text-primary-foreground font-semibold">
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
}
