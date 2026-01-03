"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, addMonths, format } from "date-fns";

export function DateRangeSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentRange = searchParams.get("range") || "month";
    const currentRefDate = searchParams.get("ref") ? new Date(searchParams.get("ref")!) : new Date();

    const updateParams = (range: string, refDate: Date) => {
        const params = new URLSearchParams(searchParams);
        params.set("range", range);
        params.set("ref", refDate.toISOString());
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handlePrevious = () => {
        if (currentRange === 'month') {
            updateParams('month', subMonths(currentRefDate, 1));
        } else if (currentRange === 'year') {
            // Logic for years could be added, straightforward
            const prevYear = new Date(currentRefDate);
            prevYear.setFullYear(prevYear.getFullYear() - 1);
            updateParams('year', prevYear);
        }
    };

    const handleNext = () => {
        if (currentRange === 'month') {
            updateParams('month', addMonths(currentRefDate, 1));
        } else if (currentRange === 'year') {
            const nextYear = new Date(currentRefDate);
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            updateParams('year', nextYear);
        }
    };

    // Format label based on range
    let label = "";
    if (currentRange === 'month') {
        label = format(currentRefDate, 'MMMM yyyy');
    } else if (currentRange === 'year') {
        label = format(currentRefDate, 'yyyy');
    } else if (currentRange === 'all') {
        label = "All Time";
    }

    return (
        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-white/5">
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={currentRange === 'all'}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[140px] text-center text-sm font-medium">
                    {label}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentRange === 'all'}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-4 w-[1px] bg-white/10 mx-2" />

            <div className="flex items-center gap-1">
                <Button
                    variant={currentRange === 'month' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => updateParams('month', new Date())}
                >
                    Month
                </Button>
                <Button
                    variant={currentRange === 'year' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => updateParams('year', new Date())}
                >
                    Year
                </Button>
                <Button
                    variant={currentRange === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => updateParams('all', new Date())}
                >
                    All
                </Button>
            </div>
        </div>
    );
}
