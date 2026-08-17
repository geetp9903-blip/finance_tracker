"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { flushTransactionsByCriteria } from "@/lib/actions/finance";
import { Trash2, AlertTriangle, Calendar, Filter, DollarSign, Search, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";

interface MassDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories?: string[];
}

export function MassDeleteModal({
    isOpen,
    onClose,
    categories = ['Food', 'Utilities', 'Subscription', 'Entertainment', 'Housing', 'Health', 'Transport', 'Shopping', 'Salary', 'Investment']
}: MassDeleteModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'date' | 'category' | 'type' | 'period' | 'amount' | 'keyword' | 'wipe_all'>('date');
    const [beforeDate, setBeforeDate] = useState("");
    const [category, setCategory] = useState(categories[0] || "");
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [keyword, setKeyword] = useState("");
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const [isPending, startTransition] = useTransition();

    const handleFlush = async () => {
        setStatusMessage("");

        if (mode === 'wipe_all' && !confirmChecked) {
            setStatusMessage("Please check the confirmation box below to proceed with wiping all transactions.");
            return;
        }

        startTransition(async () => {
            let res;
            if (mode === 'date') {
                if (!beforeDate) {
                    setStatusMessage("Please select a cutoff date.");
                    return;
                }
                res = await flushTransactionsByCriteria({ beforeDate });
            } else if (mode === 'category') {
                res = await flushTransactionsByCriteria({ category });
            } else if (mode === 'type') {
                res = await flushTransactionsByCriteria({ type });
            } else if (mode === 'period') {
                res = await flushTransactionsByCriteria({ year, month });
            } else if (mode === 'amount') {
                res = await flushTransactionsByCriteria({
                    minAmount: minAmount ? Number(minAmount) : undefined,
                    maxAmount: maxAmount ? Number(maxAmount) : undefined,
                });
            } else if (mode === 'keyword') {
                if (!keyword.trim()) {
                    setStatusMessage("Please enter a description search keyword.");
                    return;
                }
                res = await flushTransactionsByCriteria({ keyword });
            } else if (mode === 'wipe_all') {
                res = await flushTransactionsByCriteria({ flushAll: true });
            }

            if (res) {
                setStatusMessage(res.message);
                if (res.success) {
                    router.refresh();
                    setTimeout(() => {
                        onClose();
                        setStatusMessage("");
                    }, 1000);
                }
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mass Delete / Targeted Flush">
            <div className="space-y-4">
                <p className="text-xs text-muted-foreground -mt-3">
                    Flexibly flush transactions by date, category, period, or criteria (soft-deleted with trash safety).
                </p>

                {/* Flush Mode Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-accent/40 rounded-xl border border-border/40 text-xs">
                    <button
                        onClick={() => setMode('date')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${mode === 'date' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Calendar className="w-3 h-3 inline mr-1" /> Up to Date
                    </button>
                    <button
                        onClick={() => setMode('category')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${mode === 'category' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Filter className="w-3 h-3 inline mr-1" /> By Category
                    </button>
                    <button
                        onClick={() => setMode('period')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${mode === 'period' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Month / Year
                    </button>
                    <button
                        onClick={() => setMode('amount')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${mode === 'amount' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <DollarSign className="w-3 h-3 inline mr-1" /> Amount
                    </button>
                    <button
                        onClick={() => setMode('keyword')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${mode === 'keyword' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Search className="w-3 h-3 inline mr-1" /> Keyword
                    </button>
                    <button
                        onClick={() => setMode('wipe_all')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${mode === 'wipe_all' ? 'bg-destructive text-destructive-foreground shadow font-bold' : 'text-destructive hover:bg-destructive/10'}`}
                    >
                        <ShieldAlert className="w-3 h-3 inline mr-1" /> Wipe All
                    </button>
                </div>

                {/* Flush Criteria Forms */}
                <div className="space-y-4 py-1">
                    {mode === 'date' && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Flush all transactions on or before date:</label>
                            <Input
                                type="date"
                                value={beforeDate}
                                onChange={(e) => setBeforeDate(e.target.value)}
                                className="bg-background"
                            />
                            <p className="text-[11px] text-muted-foreground">All transactions dated up to this cutoff date will be soft-deleted.</p>
                        </div>
                    )}

                    {mode === 'category' && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Select Category to flush:</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-muted-foreground">Deletes all transactions belonging to the selected category.</p>
                        </div>
                    )}

                    {mode === 'period' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Year:</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mt-1"
                                >
                                    {[0, 1, 2, 3, 4].map((i) => {
                                        const y = new Date().getFullYear() - i;
                                        return <option key={y} value={y}>{y}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Month:</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm mt-1"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {mode === 'amount' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Min Amount:</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Max Amount:</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'keyword' && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">Flush description containing keyword:</label>
                            <Input
                                placeholder="e.g. Uber, Netflix, Cash..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                        </div>
                    )}

                    {mode === 'wipe_all' && (
                        <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/40 space-y-3">
                            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                                <AlertTriangle className="w-5 h-5 shrink-0 text-destructive" />
                                <span>Danger Zone: Flush All Transactions</span>
                            </div>
                            <p className="text-xs text-destructive-foreground">
                                This will soft-delete your <strong>ENTIRE transaction history</strong>.
                            </p>

                            <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    className="w-4 h-4 accent-destructive rounded cursor-pointer"
                                />
                                <span className="text-xs font-medium text-foreground">
                                    I confirm I want to soft-delete all transactions
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {statusMessage && (
                    <div className={`text-xs p-3 rounded-lg border font-medium flex items-center gap-2 ${statusMessage.includes('Successfully') || statusMessage.includes('flushed') || statusMessage.includes('deleted') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-destructive/15 text-destructive border-destructive/30'}`}>
                        {statusMessage.includes('Successfully') ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />}
                        <span>{statusMessage}</span>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleFlush}
                        disabled={isPending}
                        className={mode === 'wipe_all' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold px-4' : 'bg-destructive/80 hover:bg-destructive text-white font-semibold'}
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                        {mode === 'wipe_all' ? 'Confirm Flush All' : 'Flush Transactions'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
