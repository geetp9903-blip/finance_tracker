"use client";

import { useOptimistic, startTransition, useState } from "react";
import { updateCategoryLimit } from "@/lib/actions/budget";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, Pencil, X } from "lucide-react";

type Allocation = {
    id: string;
    name: string;
    percentage: number;
    color: string;
    cap?: number;
};

export function BudgetManager({ allocations, currency = 'USD' }: { allocations: Allocation[], currency?: string }) {
    // Optimistic State
    const [optimisticAllocations, addOptimisticAllocation] = useOptimistic(
        allocations,
        (state, updatedAllocation: { id: string; cap: number }) => {
            return state.map(a =>
                a.id === updatedAllocation.id ? { ...a, cap: updatedAllocation.cap } : a
            );
        }
    );

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {optimisticAllocations.map(allocation => (
                <BudgetCard
                    key={allocation.id}
                    allocation={allocation}
                    formatter={formatter}
                    onUpdate={(cap) => {
                        startTransition(async () => {
                            addOptimisticAllocation({ id: allocation.id, cap });
                            await updateCategoryLimit(allocation.id, cap);
                        });
                    }}
                />
            ))}
        </div>
    );
}

function BudgetCard({ allocation, onUpdate, formatter }: { allocation: Allocation; onUpdate: (val: number) => void, formatter: Intl.NumberFormat }) {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(allocation.cap?.toString() || "");

    const handleSave = () => {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
            onUpdate(num);
            setIsEditing(false);
        }
    };

    return (
        <Card className="glass-card overflow-hidden transition-all hover:scale-[1.02]">
            <div className="h-2 w-full" style={{ backgroundColor: allocation.color }} />
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                    {allocation.name}
                    <span className="text-sm font-normal text-muted-foreground">{allocation.percentage}%</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Monthly Limit</span>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                className="h-8 w-24 text-right"
                                autoFocus
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleSave}>
                                <Save className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">
                                {allocation.cap ? formatter.format(allocation.cap) : <span className="text-sm text-muted-foreground/50">Unset</span>}
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-50 hover:opacity-100" onClick={() => { setVal(allocation.cap?.toString() || ""); setIsEditing(true); }}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
