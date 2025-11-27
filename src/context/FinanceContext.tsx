"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Budget, AppData } from '@/lib/types';
import { useAuth } from './AuthContext';

interface FinanceContextType {
    transactions: Transaction[];
    budget: Budget;
    currency: string;
    setCurrency: (code: string) => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    updateBudget: (budget: Budget) => Promise<void>;
    refreshData: () => Promise<void>;
    formatAmount: (amount: number) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budget, setBudget] = useState<Budget>({ fixedExpenses: [], allocations: [] });
    const [currency, setCurrency] = useState('INR');

    const refreshData = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/finance', {
                headers: { 'x-user-id': user.username }
            });
            const data = await res.json();
            if (data.transactions) setTransactions(data.transactions);
            if (data.budget) setBudget(data.budget);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        if (!user) return;
        const newTransaction = { ...t, id: crypto.randomUUID() };
        const res = await fetch('/api/finance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.username
            },
            body: JSON.stringify({ type: 'transaction', data: newTransaction }),
        });
        if (res.ok) {
            setTransactions(prev => [...prev, newTransaction]);
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
            currency,
            setCurrency,
            addTransaction,
            deleteTransaction,
            updateBudget,
            refreshData,
            formatAmount
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
