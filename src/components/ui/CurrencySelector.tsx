import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export const CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

interface CurrencySelectorProps {
    currentCurrency: string;
    onSelect: (code: string) => void;
}

export function CurrencySelector({ currentCurrency, onSelect }: CurrencySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full glass-button px-4 py-2 text-sm font-medium"
            >
                <Globe className="h-4 w-4" />
                <span>{selected.symbol} {selected.code}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-12 z-20 w-56 glass-card overflow-hidden p-1"
                        >
                            {CURRENCIES.map((currency) => (
                                <button
                                    key={currency.code}
                                    onClick={() => {
                                        onSelect(currency.code);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/10",
                                        currentCurrency === currency.code && "bg-white/20"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-white/60">{currency.symbol}</span>
                                        {currency.name}
                                    </span>
                                    {currentCurrency === currency.code && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
