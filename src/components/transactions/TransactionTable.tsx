"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Filter, Pencil } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/finance";
import { EditTransactionModal } from "./EditTransactionModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/DropdownMenu";

type Transaction = {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
};

type Metadata = {
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
};

export function TransactionTable({
    transactions,
    metadata,
    currency = 'USD'
}: {
    transactions: Transaction[],
    metadata: Metadata,
    currency?: string
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Optimistic UI for Deletion
    const [optimisticTransactions, removeOptimisticTransaction] = useOptimistic(
        transactions,
        (state, idToDelete: string) => state.filter(t => t.id !== idToDelete)
    );

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Filter State
    const [query, setQuery] = useState(searchParams.get("query") || "");

    function handleSearch(term: string) {
        setQuery(term);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        params.set("page", "1"); // Reset usage
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    // Inside component:
    function handlePage(newPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    function handleFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    function handleSort(sort: string, dir: string) {
        const params = new URLSearchParams(searchParams);
        params.set('sort', sort);
        params.set('dir', dir);
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            removeOptimisticTransaction(id);
            await deleteTransaction(id);
        });
    }

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Transaction History</CardTitle>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    {/* Search & Basic Filter */}
                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-8"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* Type Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" title="Filter Type">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleFilter('type', 'all')}>All Types</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilter('type', 'income')}>Income</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilter('type', 'expense')}>Expense</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" title="Sort">
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSort('date', 'desc')}>Most Recent</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSort('date', 'asc')}>Oldest First</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSort('amount', 'desc')}>Highest Amount</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSort('amount', 'asc')}>Lowest Amount</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Date Filters */}
                    <div className="flex gap-2">
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={searchParams.get('year') || ''}
                            onChange={(e) => handleFilter('year', e.target.value)}
                        >
                            <option value="">All Years</option>
                            {[0, 1, 2, 3, 4].map(i => {
                                const y = new Date().getFullYear() - i;
                                return <option key={y} value={y}>{y}</option>
                            })}
                        </select>

                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={searchParams.get('month') || ''}
                            onChange={(e) => handleFilter('month', e.target.value)}
                        >
                            <option value="">All Months</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-white/10 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">Description</th>
                                <th className="p-4 hidden md:table-cell">Category</th>
                                <th className="p-4 hidden md:table-cell">Date</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {optimisticTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <p>No transactions found.</p>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open('/api/debug/migrate-legacy?source=geetp9903', '_blank')}
                                            >
                                                Recover Legacy Data
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                optimisticTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-medium">{t.description}</div>
                                            <div className="text-xs text-muted-foreground md:hidden mt-1">
                                                {t.category} • {format(new Date(t.date), 'MMM d, yyyy')}
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-muted-foreground">
                                            {format(new Date(t.date), 'MMM d, yyyy')}
                                        </td>
                                        <td className={`p-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatter.format(t.amount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setEditingTransaction(t as Transaction)}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-muted-foreground">
                        Showing {(metadata.page - 1) * 50 + 1} to {Math.min(metadata.page * 50, metadata.total)} of {metadata.total} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePage(metadata.page - 1)}
                            disabled={metadata.page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePage(metadata.page + 1)}
                            disabled={!metadata.hasMore}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <EditTransactionModal
                    key={editingTransaction?.id || 'edit-modal'}
                    isOpen={!!editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                    transaction={editingTransaction}
                />
            </CardContent>
        </Card>
    );
}
