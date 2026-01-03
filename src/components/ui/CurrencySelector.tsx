"use client";

import { useState, useTransition } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { updateCurrency } from "@/lib/actions/settings";
import { CircleDollarSign, Coins, Check } from "lucide-react";

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

import { useRouter } from "next/navigation";

export function CurrencySelector({ currentCurrency = 'INR' }: { currentCurrency?: string }) {
    const router = useRouter();
    const [currency, setCurrency] = useState(currentCurrency);
    const [isPending, startTransition] = useTransition();

    const handleSelect = (code: string) => {
        setCurrency(code); // Optimistic
        startTransition(async () => {
            await updateCurrency(code);
            router.refresh();
        });
    };

    const activeCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES.find(c => c.code === 'INR');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground hover:text-foreground">
                    <Coins className="mr-2 h-4 w-4" />
                    {activeCurrency?.symbol} {activeCurrency?.code}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {CURRENCIES.map((c) => (
                    <DropdownMenuItem
                        key={c.code}
                        onClick={() => handleSelect(c.code)}
                        className="flex items-center justify-between min-w-[150px]"
                    >
                        <span>{c.symbol} {c.name}</span>
                        {currency === c.code && <Check className="ml-2 h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
