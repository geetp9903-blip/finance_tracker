"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartInput } from "@/components/ui/SmartInput";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { updateTransaction } from "@/lib/actions/finance";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Simple Select for Type until we have a UI component
const TRANSACTION_TYPES = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' }
];

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: {
        id: string;
        amount: number;
        description: string;
        category: string;
        type: 'income' | 'expense';
        date: string;
    } | null;
}

export function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [amount, setAmount] = useState<number | "">(transaction?.amount ?? "");
    const [description, setDescription] = useState(transaction?.description ?? "");
    const [category, setCategory] = useState(transaction?.category ?? "");
    const [type, setType] = useState<"income" | "expense">(transaction?.type ?? "expense");

    // Parse initial date
    const [date, setDate] = useState(() => {
        if (!transaction?.date) return "";
        try {
            return new Date(transaction.date).toISOString().split('T')[0];
        } catch {
            return "";
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!transaction || !amount || !description || !category) return;

        startTransition(async () => {
            const result = await updateTransaction(transaction.id, {
                amount: Number(amount),
                description,
                category,
                type,
                date: new Date(date).toISOString()
            });

            if (result.success) {
                onClose();
                router.refresh();
            } else {
                console.error("Failed to update");
            }
        });
    };

    if (!transaction) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <SmartInput
                        value={amount}
                        onValueChange={setAmount}
                        placeholder="0.00"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={type}
                            onChange={(e) => setType(e.target.value as "income" | "expense")}
                        >
                            {TRANSACTION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <CategorySelector
                        value={category}
                        onChange={setCategory}
                        existingCategories={[]}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this for?"
                    />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending || !amount || !category}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
