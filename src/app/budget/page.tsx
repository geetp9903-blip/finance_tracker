"use client";
import { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { BudgetEntry } from "@/lib/types";

export default function BudgetPage() {
    const { transactions, formatAmount, budget, updateBudget } = useFinance();
    const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');

    // Load budget entries from Context (Backend)
    useEffect(() => {
        if (budget.entries) {
            setBudgetEntries(budget.entries);
        }
    }, [budget]);

    const saveBudgetEntries = async (entries: BudgetEntry[]) => {
        setBudgetEntries(entries);
        // Persist to backend via Context
        await updateBudget({
            ...budget,
            entries: entries
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry: BudgetEntry = {
            id: crypto.randomUUID(),
            description,
            amount: parseFloat(amount),
            category,
            type,
        };
        await saveBudgetEntries([...budgetEntries, newEntry]);
        setIsModalOpen(false);
        setDescription(""); setAmount(""); setCategory("");
    };

    const deleteEntry = async (id: string) => {
        await saveBudgetEntries(budgetEntries.filter(e => e.id !== id));
    };

    // Calculate totals
    const plannedIncome = budgetEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const plannedExpenses = budgetEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const plannedBalance = plannedIncome - plannedExpenses;

    const actualIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const actualExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const actualBalance = actualIncome - actualExpenses;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Monthly Budget Plan</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Budget Item
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card p-6">
                    <p className="text-sm text-white/60">Planned Income</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-400">{formatAmount(plannedIncome)}</p>
                    <p className="mt-1 text-xs text-white/40">Actual: {formatAmount(actualIncome)}</p>
                </Card>
                <Card className="glass-card p-6">
                    <p className="text-sm text-white/60">Planned Expenses</p>
                    <p className="mt-2 text-2xl font-bold text-red-400">{formatAmount(plannedExpenses)}</p>
                    <p className="mt-1 text-xs text-white/40">Actual: {formatAmount(actualExpenses)}</p>
                </Card>
                <Card className="glass-card p-6">
                    <p className="text-sm text-white/60">Planned Balance</p>
                    <p className={cn("mt-2 text-2xl font-bold", plannedBalance >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {formatAmount(plannedBalance)}
                    </p>
                    <p className="mt-1 text-xs text-white/40">Actual: {formatAmount(actualBalance)}</p>
                </Card>
            </div>

            {/* Budget Entries */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Budget Entries</h2>
                {budgetEntries.map((entry) => (
                    <Card key={entry.id} className="glass-card flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
                                entry.type === 'income' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            )}>
                                {entry.category ? entry.category.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                                <p className="font-medium text-white">{entry.description}</p>
                                <p className="text-sm text-white/50">{entry.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={cn("font-semibold", entry.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                                {entry.type === 'income' ? '+' : '-'}{formatAmount(entry.amount)}
                            </span>
                            <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </Card>
                ))}
                {budgetEntries.length === 0 && (
                    <p className="text-center text-white/40 py-12">No budget entries yet. Add one to start planning!</p>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Budget Item">
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
                        <Input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Rent, Salary" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Amount</label>
                        <Input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Category</label>
                        <Input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Housing, Work" />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Add Item</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
