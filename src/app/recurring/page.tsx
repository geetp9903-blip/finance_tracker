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
import { motion } from "framer-motion";

import { useAuth } from "@/context/AuthContext";

import { cacheService } from "@/lib/cache";

export default function RecurringPage() {
    const { user } = useAuth();
    const [rules, setRules] = useState<RecurringRule[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState<TransactionType>('expense');
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [startDate, setStartDate] = useState("");

    const fetchRules = async (forceRefresh = false) => {
        if (!user) return;

        const cacheKey = `recurring_rules_${user.username}`;
        if (!forceRefresh) {
            const cachedRules = cacheService.get<RecurringRule[]>(cacheKey);
            if (cachedRules) {
                setRules(cachedRules);
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/recurring', {
                headers: { 'x-user-id': user.username },
                cache: 'no-store'
            });
            const data = await res.json();
            if (data.rules) {
                setRules(data.rules);
                cacheService.set(cacheKey, data.rules);
            }
        } catch (error) {
            console.error("Failed to fetch rules", error);
        } finally {
            setIsLoading(false);
        }
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
            fetchRules(true); // Refresh to see updated nextDueDates
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
            cacheService.set(`recurring_rules_${user.username}`, data.rules); // Update cache
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
            cacheService.set(`recurring_rules_${user.username}`, data.rules); // Update cache
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground bg-accent/50 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 shadow-sm w-fit">Recurring Expenses</h1>
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
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : rules.map((rule) => (
                    <div key={rule.id} className="relative h-40 group perspective-1000">
                        {/* Back Card (Delete Action) */}
                        <div className="absolute inset-0 rounded-2xl bg-destructive/20 border border-destructive/30 flex items-center justify-center z-0">
                            <button
                                onClick={() => deleteRule(rule.id)}
                                className="flex flex-col items-center gap-2 text-red-400 hover:text-red-300 transition-colors p-4"
                            >
                                <div className="p-3 rounded-full bg-destructive/20">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <span className="font-medium text-sm">Delete Rule</span>
                            </button>
                        </div>

                        {/* Front Card (Content) */}
                        <motion.div
                            className="glass-card relative h-full z-10 p-0 overflow-hidden cursor-pointer bg-card" // Use bg-card
                            whileHover={{ x: -80, rotateY: -5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <div className={cn("absolute top-0 left-0 w-1 h-full", rule.type === 'income' ? "bg-emerald-500" : "bg-destructive")} />
                            <div className="p-4 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start pl-2">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <h3 className="font-semibold text-foreground text-lg truncate" title={rule.description}>{rule.description}</h3>
                                        <p className="text-sm text-muted-foreground">{rule.category}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded-lg bg-accent/50 text-xs text-foreground capitalize shrink-0">{rule.frequency}</span>
                                </div>
                                <div className="flex justify-between items-end pl-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Amount</p>
                                        <p className={cn("text-xl font-bold", rule.type === 'income' ? "text-emerald-500" : "text-destructive")}>
                                            {rule.type === 'income' ? '+' : '-'}{rule.amount}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Next Due</p>
                                        <p className="text-sm text-foreground">{new Date(rule.nextDueDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ))}
                {!isLoading && rules.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
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
                            className={cn("flex-1 py-2 rounded-lg transition-all duration-200 ease-in-out cursor-pointer hover:scale-[1.02] active:scale-[0.98]", type === 'expense' ? "bg-destructive/20 text-destructive border border-destructive/50 shadow-lg shadow-destructive/10" : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground")}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={cn("flex-1 py-2 rounded-lg transition-all duration-200 ease-in-out cursor-pointer hover:scale-[1.02] active:scale-[0.98]", type === 'income' ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 shadow-lg shadow-emerald-500/10" : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground")}
                        >
                            Income
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Description</label>
                        <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Netflix Subscription" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Amount</label>
                            <Input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Category</label>
                            <CategorySelector
                                value={category}
                                onChange={setCategory}
                                existingCategories={Array.from(new Set(rules.map(r => r.category)))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Frequency</label>
                            <select
                                className="w-full h-11 rounded-xl bg-input border border-border text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as Frequency)}
                            >
                                <option value="daily" className="bg-card text-foreground">Daily</option>
                                <option value="weekly" className="bg-card text-foreground">Weekly</option>
                                <option value="monthly" className="bg-card text-foreground">Monthly</option>
                                <option value="yearly" className="bg-card text-foreground">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
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
