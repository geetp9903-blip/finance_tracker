"use client";

import { useTransition, useState } from "react";
import { createRule } from "@/lib/actions/recurring";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight } from "lucide-react";

export function AddRuleForm() {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState("");

    const handleSubmit = (formData: FormData) => {
        setMsg("");
        startTransition(async () => {
            const res = await createRule(formData);
            if (res.error) {
                setMsg(res.error);
            } else {
                setMsg("Rule created successfully!");
                // Ideally reset form here
            }
        });
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Add New Rule</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="description" placeholder="Name (e.g. Netflix)" required />
                        <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            name="frequency"
                            className="bg-black/20 w-full rounded-md border border-white/10 p-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <select
                            name="type"
                            className="bg-black/20 w-full rounded-md border border-white/10 p-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>

                    <Input name="category" placeholder="Category" defaultValue="Subscription" required />
                    <div className="relative">
                        <Input
                            name="startDate"
                            type="date"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full min-w-0 bg-background text-foreground border-input px-3 py-2 rounded-md"
                        />
                    </div>

                    {msg && <p className="text-sm text-primary">{msg}</p>}

                    <Button className="w-full" disabled={isPending}>
                        {isPending ? "Creating..." : "Set Automation"}
                        {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
