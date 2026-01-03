'use client';

import { useOptimistic, useRef, useState } from 'react';
import { addTransaction, deleteTransaction } from '@/lib/actions/finance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // Assuming we have a Button component or need to confirm
import { Input } from '@/components/ui/Input';   // Assuming
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Define the shape of a simple transaction for the UI
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
            id: Math.random().toString(), // Temp ID
            description,
            amount,
            type,
            category,
            date: new Date().toISOString()
        });

        // 2. Clear form validation/reset
        formRef.current?.reset();

        // 3. Server Action
        await addTransaction({ message: '' }, formData);
        setIsPending(false);
    }

    const handleDelete = async (id: string) => {
        // Typically we'd also do optimistic delete here
        await deleteTransaction(id);
    };

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <Card className="h-full border-0 shadow-none flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
                <CardTitle>Recent Transactions</CardTitle>
                {/* Minimal Form Toggle could go here, for now inline form */}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Add Transaction Form */}
                <form ref={formRef} action={clientAction} className="grid gap-2 mb-4 border-b pb-4 shrink-0">
                    <div className="grid grid-cols-2 gap-2">
                        <Input name="description" placeholder="Description" required />
                        <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <select name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Salary">Salary</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Health">Health</option>
                        </select>
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Transaction
                    </Button>
                </form>

                {/* List */}
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0">
                    {optimisticTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent transactions.</p>
                    ) : (
                        optimisticTransactions.map((t) => (
                            <div key={t.id} className="flex items-center group">
                                <span className={`relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full items-center justify-center border
                                    ${t.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}
                                `}>
                                    {t.category ? t.category.charAt(0).toUpperCase() : '?'}
                                </span>
                                <div className="ml-4 space-y-1 flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-none truncate">{t.description}</p>
                                    <p className="text-xs text-muted-foreground">{t.category} • {t.date ? format(new Date(t.date), 'MMM d') : 'Now'}</p>
                                </div>
                                <div className={`ml-auto font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatter.format(t.amount)}
                                </div>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
