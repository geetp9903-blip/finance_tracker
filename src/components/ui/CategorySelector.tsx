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
                className="flex h-11 w-full items-center justify-between rounded-xl bg-input border border-border px-3 py-2 text-sm text-foreground cursor-pointer transition-all duration-200 ease-in-out hover:bg-accent/50 hover:border-accent hover:shadow-lg active:scale-[0.98]"
                onClick={() => setOpen(!open)}
            >
                <span className={value ? "text-foreground" : "text-muted-foreground"}>
                    {value || "Select category..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            </div>

            {open && (
                <div className="absolute z-[100] mt-1 max-h-[240px] w-full overflow-auto rounded-xl bg-popover border border-border py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-2 py-2 sticky top-0 bg-popover z-10 border-b border-border mb-1">
                        <input
                            type="text"
                            className="w-full rounded-lg bg-accent/50 border border-border px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 focus:bg-accent"
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
                                "relative flex cursor-pointer select-none items-center px-2 py-2 text-sm outline-none mx-1 rounded-lg transition-all duration-200 ease-in-out truncate hover:bg-accent hover:translate-x-1 text-foreground",
                                value === category && "bg-accent text-primary"
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
                            className="relative flex cursor-pointer select-none items-center px-2 py-2 text-sm outline-none hover:bg-accent mx-1 rounded-lg text-primary truncate"
                            onClick={handleCustom}
                        >
                            <Plus className="mr-2 h-4 w-4 shrink-0" />
                            <span className="truncate">Create "{search}"</span>
                        </div>
                    )}

                    {filtered.length === 0 && !search && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No categories found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
