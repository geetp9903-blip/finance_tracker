"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReminderTemplate } from "@/lib/actions/reminders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategorySelector } from "@/components/ui/CategorySelector";
import { PlusCircle, Loader2, CheckCircle2 } from "lucide-react";

export function AddReminderForm() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [category, setCategory] = useState("Subscription");
    const [type, setType] = useState<'income' | 'expense'>('expense');

    const handleSubmit = (formData: FormData) => {
        setMsg("");
        setIsSuccess(false);
        formData.set("category", category);
        formData.set("type", type);

        startTransition(async () => {
            const res = await createReminderTemplate({ message: '' }, formData);
            if (res.message) {
                setMsg(res.message);
                if (res.success) {
                    setIsSuccess(true);
                    formRef.current?.reset();
                    router.refresh();
                    setTimeout(() => setMsg(""), 3000);
                }
            }
        });
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-primary" />
                    <span>Add New Reminder Template</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="rem-title" className="text-xs font-medium text-muted-foreground mb-1 block">
                                Title / Description
                            </label>
                            <Input id="rem-title" name="title" placeholder="e.g. Netflix, Rent, Salary" required />
                        </div>
                        <div>
                            <label htmlFor="rem-amount" className="text-xs font-medium text-muted-foreground mb-1 block">
                                Default Expected Amount
                            </label>
                            <Input id="rem-amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="rem-type" className="text-xs font-medium text-muted-foreground mb-1 block">
                                Type
                            </label>
                            <select
                                id="rem-type"
                                name="type"
                                value={type}
                                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                                className="bg-background w-full rounded-md border border-input p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="expense">Expense (-)</option>
                                <option value="income">Income (+)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="rem-dueday" className="text-xs font-medium text-muted-foreground mb-1 block">
                                Due Day (1-31)
                            </label>
                            <Input id="rem-dueday" name="dueDay" type="number" min="1" max="31" defaultValue="1" required />
                        </div>

                        <div>
                            <label htmlFor="rem-frequency" className="text-xs font-medium text-muted-foreground mb-1 block">
                                Frequency
                            </label>
                            <select
                                id="rem-frequency"
                                name="frequency"
                                className="bg-background w-full rounded-md border border-input p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                        <CategorySelector
                            value={category}
                            onChange={setCategory}
                            existingCategories={[]}
                        />
                    </div>

                    {msg && (
                        <p className={`text-xs p-2.5 rounded-lg border font-medium flex items-center gap-1.5 ${isSuccess ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-destructive/15 text-destructive border-destructive/30'}`}>
                            {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                            <span>{msg}</span>
                        </p>
                    )}

                    <Button className="w-full" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Create Reminder Template
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
