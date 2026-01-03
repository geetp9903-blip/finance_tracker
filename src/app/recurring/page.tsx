import { getRecurringRules } from "@/lib/dal/recurring";
import { RuleList } from "@/components/recurring/RuleList";
import { AddRuleForm } from "@/components/recurring/AddRuleForm";
import { Card } from "@/components/ui/Card";
import { Zap } from "lucide-react";

import { assertAuth } from "@/lib/dal/auth";
import { UserModel } from "@/lib/models";
import dbConnect from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function RecurringPage() {
    const rules = await getRecurringRules();

    // Fetch User for Currency
    const userId = await assertAuth();
    await dbConnect();
    const user = await UserModel.findOne({ username: userId }).lean();
    const currency = user?.currency || 'USD';

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Automation Engine</h2>
                    <p className="text-muted-foreground">Manage your recurring subscriptions and income.</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Visual List of Rules */}
                <RuleList rules={rules} currency={currency} />

                {/* Automation Setup Wizard */}
                <div className="space-y-6">
                    <AddRuleForm />

                    <Card className="glass-card p-6 bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-full">
                                <Zap className="text-primary h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary">How it works</h3>
                                <p className="text-sm text-balance text-muted-foreground mt-1">
                                    Our engine runs every hour to check for due payments.
                                    When a rule triggers, it creates a real transaction in your dashboard
                                    and updates the "Next Due" date automatically.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
