"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartInput } from "@/components/ui/SmartInput";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { addTransaction } from "@/lib/actions/finance";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Simple Select for Type until we have a UI component
const TRANSACTION_TYPES = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' }
];

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [amount, setAmount] = useState<number | "">("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState("expense");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !description || !category) return;

        const formData = new FormData();
        formData.append('amount', amount.toString());
        formData.append('description', description);
        formData.append('category', category);
        formData.append('type', type);
        formData.append('date', new Date(date).toISOString()); // Pass ISO string

        startTransition(async () => {
            const result = await addTransaction({ message: '' }, formData);
            if (result.success) {
                onClose();
                // Reset form
                setAmount("");
                setDescription("");
                setCategory("");
                setDate(new Date().toISOString().split('T')[0]);
                router.refresh();
            } else {
                // Handle error (toast?)
                console.error(result.message);
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <SmartInput
                        value={amount}
                        onValueChange={setAmount}
                        placeholder="0.00 (Try '25+15')"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
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
                        existingCategories={[]} // We could fetch distinct categories or rely on Presets + recent
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
                        Add Transaction
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
