"use client";

import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface QuickStatsProps {
    balance: number;
    income: number;
    expense: number;
    transactionCount: number;
    currency: string;
    periodLabel: string;
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function QuickStats({ balance, income, expense, transactionCount, currency, periodLabel }: QuickStatsProps) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(1) : "0";

    return (
        <motion.div 
            variants={container} 
            initial="hidden" 
            animate="show" 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 col-span-full"
        >
            <motion.div variants={item}>
                <Card className="glass-card hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                        <div className="bg-primary/20 p-2 rounded-full">
                            <Wallet className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatter.format(balance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="glass-card hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
                        <div className="bg-emerald-500/20 p-2 rounded-full">
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{formatter.format(income)}</div>
                        <p className="text-xs text-muted-foreground mt-1">+{transactionCount} txns</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="glass-card hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
                        <div className="bg-destructive/20 p-2 rounded-full">
                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{formatter.format(expense)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="glass-card hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 h-full border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <Wallet className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{savingsRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">of Income</p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
