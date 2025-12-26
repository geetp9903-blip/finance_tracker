"use client";
import { useFinance } from "@/context/FinanceContext";
import { ParetoChart } from "@/components/analytics/ParetoChart";
import { SpendingCompositionChart } from "@/components/analytics/SpendingCompositionChart";
import { BudgetBurndownChart } from "@/components/analytics/BudgetBurndownChart";
import { CategoryTrendChart } from "@/components/analytics/CategoryTrendChart";
import { CategoryComparisonChart } from "@/components/analytics/CategoryComparisonChart";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
    const { transactions, budget, recurringRules, formatAmount, isLoading } = useFinance();

    if (isLoading) return (
        <div className="flex items-center justify-center p-8 h-[50vh] text-muted-foreground animate-pulse">
            Loading financial intelligence...
        </div>
    );

    const hasBudgetConfig = budget && (budget.fixedExpenses.length > 0 || budget.allocations.length > 0);

    return (
        <div className="space-y-6 pb-12 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col"
                >
                    <h1 className="text-3xl font-bold text-foreground bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-2 shadow-sm w-fit">
                        Financial Intelligence
                    </h1>
                    <p className="text-muted-foreground mt-2 ml-1 text-sm">
                        Deep dive into your spending behavior and efficiency.
                    </p>
                </motion.div>
            </div>

            {/* Main Grid Layout - Enforcing min-w-0 to prevent Recharts overflow in Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

                {/* 1. Structure: Spending Composition - Takes full width on mobile, 1 col on large */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="h-[420px] md:h-[450px] w-full min-w-0"
                >
                    <SpendingCompositionChart
                        transactions={transactions}
                        recurringRules={recurringRules}
                        formatAmount={formatAmount}
                    />
                </motion.div>

                {/* 2. Efficiency: Pareto Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="h-[450px] md:h-[500px] w-full min-w-0"
                >
                    <ParetoChart
                        transactions={transactions}
                        formatAmount={formatAmount}
                    />
                </motion.div>

                {/* 3. Pace: Budget Burndown */}
                {hasBudgetConfig && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="h-[400px] md:h-[400px] w-full min-w-0"
                    >
                        <BudgetBurndownChart
                            transactions={transactions}
                            budget={budget}
                            formatAmount={formatAmount}
                        />
                    </motion.div>
                )}

                {/* 4. Volatility: Category Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="h-[400px] md:h-[400px] w-full min-w-0"
                >
                    <CategoryTrendChart
                        transactions={transactions}
                        formatAmount={formatAmount}
                    />
                </motion.div>

                {/* 5. Comparisons: Multi-Category Comparison (Now at the End) - Full Width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="h-[600px] md:h-[500px] w-full min-w-0 lg:col-span-2"
                >
                    <CategoryComparisonChart
                        transactions={transactions}
                        formatAmount={formatAmount}
                    />
                </motion.div>
            </div>
        </div>
    );
}
