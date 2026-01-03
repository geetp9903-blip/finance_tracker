"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

interface ChartControlsProps {
    categories: string[];
}

// We need a wrapper for Select since 'ui/Select' might be complex, or use native for speed if shadcn select is not full.
// Assuming simple HTML select for speed if UI components aren't perfectly robust yet, 
// BUT user asked for filters. I'll use standard HTML selects designed to match the theme if imports fail, 
// but let's try to use the provided UI if possible. 
// Actually, standard select with tailwind is safer for "recovery" mode than debugging complex select components.

export function ChartControls({ categories }: ChartControlsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const view = searchParams.get("view") || "month"; // 'month' | 'year'
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || (new Date().getMonth() + 1);
    const category = searchParams.get("category") || "All";

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // Reset irrelevant params
        if (key === 'view' && value === 'year') {
            params.delete('month');
        }
        if (key === 'view' && value === 'month' && !params.get('month')) {
            params.set('month', (new Date().getMonth() + 1).toString());
        }

        startTransition(() => {
            router.replace(`?${params.toString()}`, { scroll: false });
        });
    };

    const selectClass = "bg-background border border-input rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-9 px-3 py-1";

    return (
        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-card/30 rounded-xl border border-white/5 backdrop-blur-sm shadow-sm">
            {/* View Toggle */}
            <div className="flex bg-muted rounded-lg p-1 h-9 items-center">
                <button
                    onClick={() => updateParam('view', 'month')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'month' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => updateParam('view', 'year')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'year' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Yearly
                </button>
            </div>

            {/* Year Select */}
            <select
                value={year}
                onChange={(e) => updateParam('year', e.target.value)}
                className={selectClass}
            >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {/* Month Select (Conditionally Rendered) */}
            {view === 'month' && (
                <select
                    value={month}
                    onChange={(e) => updateParam('month', e.target.value)}
                    className={selectClass}
                >
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                    ))}
                </select>
            )}

            {/* Category Select */}
            <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className={`${selectClass} min-w-[120px]`}
            >
                <option value="All">All Categories</option>
                {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
    );
}
