"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Filter, Pencil, CheckSquare, Square, Loader2 } from "lucide-react";
import { deleteTransaction, bulkDeleteTransactions } from "@/lib/actions/finance";
import { EditTransactionModal } from "./EditTransactionModal";
import { EmptyState } from "@/components/ui/EmptyState";
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

    // Multi-Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState("");

    // Optimistic UI for Deletion
    const [optimisticTransactions, removeOptimisticTransactions] = useOptimistic(
        transactions,
        (state, idsToDelete: string | string[]) => {
            const deleteSet = new Set(Array.isArray(idsToDelete) ? idsToDelete : [idsToDelete]);
            return state.filter(t => !deleteSet.has(t.id));
        }
    );

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Filter State
    const [query, setQuery] = useState(searchParams.get("query") || "");

    const isAllSelected = optimisticTransactions.length > 0 && optimisticTransactions.every(t => selectedIds.includes(t.id));

    function toggleSelectAll() {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(optimisticTransactions.map(t => t.id));
        }
    }

    function toggleSelectRow(id: string) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    function handleSearch(term: string) {
        setQuery(term);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        params.set("page", "1");
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

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
            removeOptimisticTransactions(id);
            await deleteTransaction(id);
        });
    }

    function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        const idsToProcess = [...selectedIds];
        setBulkStatus("");

        startTransition(async () => {
            removeOptimisticTransactions(idsToProcess);
            setSelectedIds([]);
            const res = await bulkDeleteTransactions(idsToProcess);
            setBulkStatus(res.message);
            setTimeout(() => setBulkStatus(""), 3000);
        });
    }

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });

    return (
        <Card className="glass-card relative">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CardTitle>Transaction History</CardTitle>
                    {selectedIds.length > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                            {selectedIds.length} Selected
                        </span>
                    )}
                </div>

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

            <CardContent className="space-y-4">
                {bulkStatus && (
                    <p className="text-xs font-medium text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        {bulkStatus}
                    </p>
                )}

                <div className="rounded-md border border-white/10 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer"
                                        title="Select All Visible"
                                    />
                                </th>
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
                                    <td colSpan={6} className="p-8">
                                        <EmptyState
                                            title="No transactions found"
                                            description="You don't have any transactions matching the current filters."
                                            actionLabel="Recover Legacy Data"
                                            onAction={() => window.open('/api/debug/migrate-legacy?source=geetp9903', '_blank')}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                optimisticTransactions.map((t) => {
                                    const isSelected = selectedIds.includes(t.id);

                                    return (
                                        <tr
                                            key={t.id}
                                            className={`transition-colors group ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/5'}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectRow(t.id)}
                                                    className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{t.description}</div>
                                                <div className="text-xs text-muted-foreground md:hidden mt-1">
                                                    {t.category} • {format(new Date(t.date), 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold border-indigo-500/30 bg-indigo-500/20 text-indigo-200 uppercase tracking-wider">
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
                                    );
                                })
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

                {/* Floating Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-3 rounded-2xl glass-card border border-primary/40 shadow-2xl flex items-center gap-4 bg-card/90 backdrop-blur-lg animate-in slide-in-from-bottom duration-200">
                        <div className="text-xs font-semibold text-foreground px-2">
                            <span className="text-primary font-bold text-sm">{selectedIds.length}</span> items selected
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-muted-foreground hover:text-foreground h-8"
                            >
                                Clear Selection
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isPending}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-8 gap-1.5 font-semibold"
                            >
                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Delete Selected ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                )}

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
