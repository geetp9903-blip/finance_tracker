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

export interface FixedExpense {
    id: string;
    name: string;
    amount: number;
}

export interface BudgetPeriod {
    id: string;
    userId: string;
    fixedExpenses: FixedExpense[];
    allocations: Allocation[];
    entries?: BudgetEntry[];
}

export interface AppData {
    transactions: Transaction[];
    budget: Budget;
    user?: User;
}
