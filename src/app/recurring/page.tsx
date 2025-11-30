"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, RefreshCw, Calendar } from "lucide-react";
import { RecurringRule, Frequency, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategorySelector } from "@/components/ui/CategorySelector";

import { useAuth } from "@/context/AuthContext";

export default function RecurringPage() {
    const { user } = useAuth();
    const [rules, setRules] = useState<RecurringRule[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState<TransactionType>('expense');
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [startDate, setStartDate] = useState("");

    const fetchRules = async () => {
        if (!user) return;
        const res = await fetch('/api/recurring', {
            headers: { 'x-user-id': user.username },
            cache: 'no-store'
        });
        const data = await res.json();
        if (data.rules) setRules(data.rules);
    };

    const processRules = async () => {
        if (!user) return;
        const res = await fetch('/api/recurring', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.username
            },
            body: JSON.stringify({ action: 'process' }),
        });
        const data = await res.json();
        if (data.success && data.newTransactionsCount > 0) {
            alert(`Generated ${data.newTransactionsCount} new transactions!`);
            fetchRules(); // Refresh to see updated nextDueDates
        } else {
            alert("No new recurring transactions due.");
        }
    };

    useEffect(() => {
        fetchRules();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const newRule: RecurringRule = {
            id: crypto.randomUUID(),
            userId: user.username,
            amount: parseFloat(amount),
            description,
            category,
            type,
            frequency,
            startDate: new Date(startDate).toISOString(),
            nextDueDate: new Date(startDate).toISOString(),
            active: true
        };

        const res = await fetch('/api/recurring', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.username
            },
            body: JSON.stringify({ action: 'add', rule: newRule }),
        });
        const data = await res.json();

        if (data.success) {
            setRules(data.rules);
            setIsModalOpen(false);
            // Reset form
            setAmount(""); setDescription(""); setCategory(""); setStartDate("");
        }
    };

    const deleteRule = async (id: string) => {
        if (!user) return;
        const res = await fetch('/api/recurring', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.username
            },
            body: JSON.stringify({ action: 'delete', id }),
        });
        const data = await res.json();
        if (data.success) {
            setRules(data.rules);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Recurring Expenses</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={processRules}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Check Due
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Rule
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.map((rule) => (
                    <Card key={rule.id} className="glass-card relative overflow-hidden">
                        <div className={cn("absolute top-0 left-0 w-1 h-full", rule.type === 'income' ? "bg-emerald-500" : "bg-red-500")} />
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold text-white text-lg">{rule.description}</h3>
                                <p className="text-sm text-white/50">{rule.category}</p>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white capitalize">{rule.frequency}</span>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                            <div>
                                <p className="text-xs text-white/40">Amount</p>
                                <p className={cn("text-xl font-bold", rule.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                                    {rule.type === 'income' ? '+' : '-'}{rule.amount}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-white/40">Next Due</p>
                                <p className="text-sm text-white">{new Date(rule.nextDueDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => deleteRule(rule.id)}
                            className="absolute top-2 right-2 p-2 text-white/20 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </Card>
                ))}
                {rules.length === 0 && (
                    <div className="col-span-full text-center py-12 text-white/40">
                        No recurring rules set. Add one to automate your finances!
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Recurring Rule">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={cn("flex-1 py-2 rounded-lg transition-colors", type === 'expense' ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-white/5 text-white/60")}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={cn("flex-1 py-2 rounded-lg transition-colors", type === 'income' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-white/5 text-white/60")}
                        >
                            Income
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm text-white/70 mb-1">Description</label>
                        <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Netflix Subscription" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Amount</label>
                            <Input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Category</label>
                            <CategorySelector
                                value={category}
                                onChange={setCategory}
                                existingCategories={Array.from(new Set(rules.map(r => r.category)))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Frequency</label>
                            <select
                                className="w-full h-11 rounded-xl bg-black/20 border border-white/10 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as Frequency)}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Start Date</label>
                            <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Rule</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
