export type TransactionType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    description: string;
    recurringRuleId?: string;
}

export interface User {
    username: string;
    pin: string;
}

export interface RecurringRule {
    id: string;
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    frequency: Frequency;
    startDate: string;
    nextDueDate: string;
    active: boolean;
}

export interface BudgetPeriod {
    id: string;
    month: number;
    year: number;
    limits: Record<string, number>;
}

export interface FixedExpense {
    id: string;
    name: string;
    amount: number;
}

export interface Allocation {
    id: string;
    name: string;
    percentage: number;
    color: string;
}

export interface Budget {
    fixedExpenses: FixedExpense[];
    allocations: Allocation[];
}

export interface AppData {
    transactions: Transaction[];
    budget: Budget;
    user?: User;
}
