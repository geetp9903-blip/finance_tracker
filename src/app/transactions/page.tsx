"use client";
import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportMenu } from "@/components/ExportMenu";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";

export default function TransactionsPage() {
    const { transactions, addTransaction, deleteTransaction, formatAmount } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount-high' | 'amount-low'>('date');
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Form State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState<'income' | 'expense'>('expense');

    const filteredTransactions = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
        })
        .filter(t => filter === 'all' || t.type === filter)
        .filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'amount-high') return b.amount - a.amount;
            if (sortBy === 'amount-low') return a.amount - b.amount;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addTransaction({
            amount: parseFloat(amount),
            description,
            category,
            type,
            date: new Date().toISOString(),
        });
        setIsModalOpen(false);
        setAmount("");
        setDescription("");
        setCategory("");
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-white">Transactions</h1>
                    <MonthYearPicker selectedDate={selectedDate} onChange={setSelectedDate} />
                </div>
                <div className="flex gap-2">
                    <ExportMenu transactions={filteredTransactions} />
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Transaction
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <Input
                        placeholder="Search transactions..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                        {(['all', 'income', 'expense'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                    filter === f ? "bg-white/10 text-white shadow-sm" : "text-white/60 hover:text-white"
                                )}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'amount-high' | 'amount-low')}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="date" className="bg-gray-900">Most Recent</option>
                        <option value="amount-high" className="bg-gray-900">Highest Amount</option>
                        <option value="amount-low" className="bg-gray-900">Lowest Amount</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredTransactions.map((t) => (
                    <Card key={t.id} className="glass-card flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
                                t.type === 'income' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                            )}>
                                {t.category.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-white">{t.description}</p>
                                <p className="text-sm text-white/50">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={cn("font-semibold", t.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                                {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
                            </span>
                            <button
                                onClick={() => deleteTransaction(t.id)}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </Card>
                ))}
                {filteredTransactions.length === 0 && (
                    <p className="text-center text-white/40 py-12">No transactions found</p>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
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
                        <label className="block text-sm text-white/70 mb-1">Amount</label>
                        <Input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Description</label>
                        <Input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Grocery" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Category</label>
                        <CategorySelector
                            value={category}
                            onChange={setCategory}
                            existingCategories={Array.from(new Set(transactions.map(t => t.category)))}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Add Transaction</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
