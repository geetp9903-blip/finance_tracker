export type TransactionType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
    id: string;
    userId: string;
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
    userId: string;
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    frequency: Frequency;
    startDate: string;
    nextDueDate: string;
    active: boolean;
    lastProcessed?: string;
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

export interface BudgetEntry {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
}

export interface Budget {
    fixedExpenses: FixedExpense[];
    allocations: Allocation[];
    entries?: BudgetEntry[];
}

export interface BudgetPeriod {
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    budget: Budget;
    transactions: string[];
}

export interface AppData {
    transactions: Transaction[];
    budget: Budget;
    user?: User;
}
