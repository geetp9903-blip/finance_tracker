"use client";

import { useTransition } from "react";
import { toggleRule, deleteRule, triggerInternalCron } from "@/lib/actions/recurring";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Play, Pause, Trash2, RefreshCw } from "lucide-react";
import { RecurringRule } from "@/lib/types";

export function RuleList({ rules, currency = 'USD' }: { rules: RecurringRule[], currency?: string }) {
    const [isPending, startTransition] = useTransition();

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Subscriptions & Rules</CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startTransition(async () => { await triggerInternalCron(); })}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-primary"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                    Run Check
                </Button>
            </CardHeader>
            <CardContent>
                {rules.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No recurring rules set.</p>
                ) : (
                    <div className="space-y-4">
                        {rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                                <div>
                                    <h4 className="font-semibold">{rule.description}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {formatter.format(rule.amount)} • {rule.frequency} • Next: {new Date(rule.nextDueDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={rule.active ? "text-green-400" : "text-yellow-400"}
                                        onClick={() => startTransition(async () => { await toggleRule(rule.id, !rule.active); })}
                                    >
                                        {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive/70 hover:text-destructive"
                                        onClick={() => startTransition(async () => { await deleteRule(rule.id); })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
