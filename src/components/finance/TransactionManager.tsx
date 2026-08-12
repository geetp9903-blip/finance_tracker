'use client';

import { useOptimistic, useRef, useState } from 'react';
import { addTransaction, deleteTransaction } from '@/lib/actions/finance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
};

export function TransactionManager({
    initialTransactions,
    currency = 'USD'
}: {
    initialTransactions: Transaction[],
    currency?: string
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, setIsPending] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Optimistic State
    const [optimisticTransactions, addOptimisticTransaction] = useOptimistic(
        initialTransactions,
        (state, newTransaction: Transaction) => [newTransaction, ...state]
    );

    async function clientAction(formData: FormData) {
        setIsPending(true);
        const description = formData.get('description') as string;
        const amount = Number(formData.get('amount'));
        const type = formData.get('type') as 'income' | 'expense';
        const category = formData.get('category') as string;

        // 1. Optimistic Update
        addOptimisticTransaction({
            id: Math.random().toString(),
            description,
            amount,
            type,
            category,
            date: new Date().toISOString()
        });

        // 2. Clear form
        formRef.current?.reset();
        setShowForm(false);

        // 3. Server Action
        await addTransaction({ message: '' }, formData);
        setIsPending(false);
    }

    const handleDelete = async (id: string) => {
        await deleteTransaction(id);
    };

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
    });

    return (
        <Card className="h-full border-0 shadow-none flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between shrink-0 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground font-medium">
                        {optimisticTransactions.length}
                    </span>
                </div>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowForm(!showForm)}
                    className="h-8 text-xs font-medium text-primary hover:bg-primary/10"
                >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add
                    {showForm ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
                </Button>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 pt-3">
                {/* Collapsible Add Transaction Form */}
                {showForm && (
                    <form ref={formRef} action={clientAction} className="grid gap-2.5 mb-3 border-b border-border/40 pb-3 shrink-0 bg-accent/20 p-3 rounded-xl">
                        <div className="grid grid-cols-2 gap-2">
                            <Input name="description" placeholder="Description" required className="h-9 text-xs" />
                            <Input name="amount" type="number" step="0.01" placeholder="Amount" required className="h-9 text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select name="type" className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:ring-2 focus:ring-primary/50">
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                            <select name="category" className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:ring-2 focus:ring-primary/50">
                                <option value="Food">Food</option>
                                <option value="Transport">Transport</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Salary">Salary</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Health">Health</option>
                                <option value="Shopping">Shopping</option>
                            </select>
                        </div>
                        <Button type="submit" disabled={isPending} size="sm" className="w-full text-xs h-8">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Transaction
                        </Button>
                    </form>
                )}

                {/* Scrollable Transactions List with Max Height */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1.5 min-h-0 text-xs">
                    {optimisticTransactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No recent transactions.</p>
                    ) : (
                        optimisticTransactions.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card/40 border border-border/40 hover:border-border transition-all group">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs border
                                        ${t.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}
                                    `}>
                                        {t.category ? t.category.charAt(0).toUpperCase() : '?'}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-foreground text-xs truncate">{t.description}</p>
                                        <p className="text-[11px] text-muted-foreground">{t.category} • {t.date ? format(new Date(t.date), 'MMM d') : 'Now'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`font-bold text-xs ${t.type === 'income' ? 'text-emerald-400' : 'text-foreground'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatter.format(t.amount)}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        title="Delete transaction"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
