"use client";

import dynamic from "next/dynamic";

// Lazy load the interactive transaction manager
const TransactionManager = dynamic(
    () => import("@/components/finance/TransactionManager").then(mod => mod.TransactionManager),
    {
        ssr: false,
        loading: () => (
            <div className="h-full border-0 shadow-none flex flex-col gap-4 p-4">
                <div className="h-8 w-1/3 bg-white/5 rounded animate-pulse" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
);

interface LazyTransactionsProps {
    transactions: any[];
    currency: string;
}

export function LazyTransactions({ transactions, currency }: LazyTransactionsProps) {
    return (
        <TransactionManager
            initialTransactions={transactions}
            currency={currency}
        />
    );
}
