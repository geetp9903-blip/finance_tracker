"use client";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
    value: string;
    onChange: (value: string) => void;
    existingCategories: string[];
}

const PRESET_CATEGORIES = [
    "Food",
    "Transport",
    "Utilities",
    "Entertainment",
    "Shopping",
    "Health",
    "Education",
    "Housing",
    "Salary",
    "Investment",
    "Freelance"
];

export function CategorySelector({ value, onChange, existingCategories }: CategorySelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Combine presets and existing, remove duplicates, sort
    const allCategories = Array.from(new Set([...PRESET_CATEGORIES, ...existingCategories])).sort();

    const filtered = allCategories.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (category: string) => {
        onChange(category);
        setOpen(false);
        setSearch("");
    };

    const handleCustom = () => {
        if (search) {
            // Capitalize first letter
            const formatted = search.charAt(0).toUpperCase() + search.slice(1);
            onChange(formatted);
            setOpen(false);
            setSearch("");
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="flex h-11 w-full items-center justify-between rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-white cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span className={value ? "text-white" : "text-white/50"}>
                    {value || "Select category..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>

            {open && (
                <div className="absolute z-[100] mt-1 max-h-[240px] w-full overflow-auto rounded-xl bg-[#1a1b1e] border border-white/10 py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-2 py-2 sticky top-0 bg-[#1a1b1e] z-10 border-b border-white/5 mb-1">
                        <input
                            type="text"
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Search or add..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCustom();
                                }
                            }}
                        />
                    </div>

                    {filtered.map((category) => (
                        <div
                            key={category}
                            className={cn(
                                "relative flex cursor-pointer select-none items-center px-2 py-2 text-sm outline-none hover:bg-white/10 mx-1 rounded-lg transition-colors truncate",
                                value === category && "bg-white/10 text-primary"
                            )}
                            onClick={() => handleSelect(category)}
                            title={category}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    value === category ? "opacity-100" : "opacity-0"
                                )}
                            />
                            <span className="truncate">{category}</span>
                        </div>
                    ))}

                    {search && !filtered.some(c => c.toLowerCase() === search.toLowerCase()) && (
                        <div
                            className="relative flex cursor-pointer select-none items-center px-2 py-2 text-sm outline-none hover:bg-white/10 mx-1 rounded-lg text-primary truncate"
                            onClick={handleCustom}
                        >
                            <Plus className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">Create "{search}"</span>
                        </div>
                    )}

                    {filtered.length === 0 && !search && (
                        <div className="py-6 text-center text-sm text-white/40">
                            No categories found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
