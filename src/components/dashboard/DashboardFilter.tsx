'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { Filter, ChevronDown, Check, ChevronRight, ChevronLeft } from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Generate years: Current year and previous 4 years
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type FilterView = 'main' | 'year' | 'month-year' | 'month-select';

export function DashboardFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [view, setView] = useState<FilterView>('main');
    const [selectedYearForMonth, setSelectedYearForMonth] = useState<number>(currentYear);

    // Parse current state
    const currentPeriod = searchParams.get('period') || 'all';
    const currentYearParam = searchParams.get('year') ? parseInt(searchParams.get('year')!) : currentYear;
    const currentMonthParam = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth();

    const updateFilter = (newPeriod: string, year?: number, month?: number) => {
        const params = new URLSearchParams();

        if (newPeriod !== 'all') {
            params.set('period', newPeriod);
            if (year) params.set('year', year.toString());
            if (month !== undefined) params.set('month', month.toString());
        }

        router.push(`?${params.toString()}`);
        setView('main'); // Reset view on selection
    };

    const getLabel = () => {
        if (currentPeriod === 'all') return 'All Time';
        if (currentPeriod === 'year') return `Year: ${currentYearParam}`;
        if (currentPeriod === 'month') return `${MONTHS[currentMonthParam]} ${currentYearParam}`;
        return 'Filter';
    };

    // Reset view when menu closes (conceptually - though we don't hook into onOpenChange here easily 
    // without controlling the state ourselves. For now, it stays where it was or resets on selection)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="truncate">{getLabel()}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                {view === 'main' && (
                    <>
                        <DropdownMenuLabel>View Period</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => updateFilter('all')}>
                            <span className={currentPeriod === 'all' ? "font-bold" : ""}>All Time</span>
                            {currentPeriod === 'all' && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Keep menu open
                            setView('year');
                        }}>
                            <span>Specific Year</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setView('month-year');
                        }}>
                            <span>Specific Month</span>
                            <ChevronRight className="ml-auto h-4 w-4" />
                        </DropdownMenuItem>
                    </>
                )}

                {view === 'year' && (
                    <>
                        <div className="flex items-center px-2 py-1.5 border-b mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 px-2 mr-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setView('main');
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-sm">Select Year</span>
                        </div>
                        {YEARS.map(year => (
                            <DropdownMenuItem key={year} onClick={() => updateFilter('year', year)}>
                                <span>{year}</span>
                                {currentPeriod === 'year' && currentYearParam === year && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {view === 'month-year' && (
                    <>
                        <div className="flex items-center px-2 py-1.5 border-b mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 px-2 mr-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setView('main');
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-sm">Select Year</span>
                        </div>
                        {YEARS.map(year => (
                            <DropdownMenuItem
                                key={year}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedYearForMonth(year);
                                    setView('month-select');
                                }}
                            >
                                <span>{year}</span>
                                <ChevronRight className="ml-auto h-4 w-4" />
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {view === 'month-select' && (
                    <>
                        <div className="flex items-center px-2 py-1.5 border-b mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 px-2 mr-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setView('month-year');
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold text-sm">{selectedYearForMonth}</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {MONTHS.map((month, index) => (
                                <DropdownMenuItem
                                    key={month}
                                    onClick={() => updateFilter('month', selectedYearForMonth, index)}
                                >
                                    <span>{month}</span>
                                    {currentPeriod === 'month' && currentYearParam === selectedYearForMonth && currentMonthParam === index && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
