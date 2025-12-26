"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Transaction, Budget, AppData, RecurringRule } from '@/lib/types';
import { useAuth } from './AuthContext';

interface FinanceContextType {
    transactions: Transaction[];
    budget: Budget;
    recurringRules: RecurringRule[];
    currency: string;
    setCurrency: (code: string) => void;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
    editTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    updateBudget: (budget: Budget) => Promise<void>;
    refreshData: () => Promise<void>;
    formatAmount: (amount: number) => string;
    isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budget, setBudget] = useState<Budget>({ fixedExpenses: [], allocations: [] });
    const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
    const [currency, setCurrency] = useState('INR');
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/finance', {
                headers: { 'x-user-id': user.username }
            });
            const data = await res.json();
            if (data.transactions) setTransactions(data.transactions);
            if (data.budget) setBudget(data.budget);
            if (data.recurringRules) setRecurringRules(data.recurringRules);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Wait for auth to complete before deciding what to do
        if (authLoading) {
            // Auth is still loading, keep finance loading too
            setIsLoading(true);
            return;
        }

        if (user) {
            // User is authenticated, fetch data
            refreshData();
        } else {
            // Auth is complete and no user - stop loading
            setIsLoading(false);
        }
    }, [user, authLoading, refreshData]);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const addTransaction = async (t: Omit<Transaction, 'id' | 'userId'>) => {
        if (!user) {
            console.error("User not found in context");
            alert("Error: User not logged in");
            return;
        }
        try {
            const newTransaction = { ...t, id: generateId(), userId: user.username };
            console.log("Adding transaction:", newTransaction);

            const res = await fetch('/api/finance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.username
                },
                body: JSON.stringify({ type: 'transaction', data: newTransaction }),
            });

            if (res.ok) {
                console.log("Transaction added successfully");
                setTransactions(prev => [...prev, newTransaction]);
            } else {
                const err = await res.json();
                console.error("Failed to add transaction:", err);
                alert(`Failed to add transaction: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error adding transaction:", error);
            alert("Error adding transaction. Please check console.");
        }
    };



    const editTransaction = async (id: string, updates: Partial<Transaction>) => {
        if (!user) return;

        // Optimistic Update
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

        try {
            const res = await fetch('/api/finance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.username
                },
                body: JSON.stringify({ type: 'edit_transaction', data: { id, updates } }),
            });

            if (!res.ok) {
                // Revert on failure
                console.error("Failed to edit transaction");
                refreshData();
                alert("Failed to save changes.");
            }
        } catch (error) {
            console.error("Error editing transaction:", error);
            refreshData();
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return;
        const res = await fetch('/api/finance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.username
            },
            body: JSON.stringify({ type: 'delete_transaction', data: { id } }),
        });
        if (res.ok) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const updateBudget = async (newBudget: Budget) => {
        if (!user) return;
        const res = await fetch('/api/finance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.username
            },
            body: JSON.stringify({ type: 'budget', data: newBudget }),
        });
        if (res.ok) {
            setBudget(newBudget);
        }
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <FinanceContext.Provider value={{
            transactions,
            budget,
            recurringRules,
            currency,
            setCurrency,
            addTransaction,
            editTransaction,
            deleteTransaction,
            updateBudget,
            refreshData,
            formatAmount,
            isLoading
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
}
