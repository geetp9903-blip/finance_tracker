export type TransactionType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface WidgetConfig {
    id: string; // e.g., 'quick_stats', 'predictive_cashflow', 'pending_reminders', etc.
    enabled: boolean;
    colSpan: number; // 1 to 12
    heightPx?: number; // Height in pixels e.g., 340, 420, 500, 600
    order: number;
}

export interface DashboardLayoutSettings {
    widgets: WidgetConfig[];
    preset?: 'default' | 'analytics' | 'reminders_cashflow' | 'minimal' | 'custom';
}

export interface User {
    id: string;
    username: string;
    pin: string;
    email?: string;
    totpSecret?: string;
    refreshToken?: string;
    otp?: {
        code: string;
        expires: number;
    };
    currency?: string;
    usernameUpdates?: {
        count: number;
        lastReset: number; // timestamp
    };
    inactivityNotices?: {
        sent38: boolean;
        sent42: boolean;
        sent44: boolean;
    };
    dashboardLayout?: DashboardLayoutSettings;
    aiConsent?: {
        enabled: boolean;
        consentedAt?: string;
        termsVersion: string;
    };
}

export type InsightSeverity = 'critical' | 'warning' | 'tip' | 'positive';
export type InsightCategory = 'cashflow_risk' | 'category_spike' | 'subscription_creep' | 'budget_burndown' | 'general_advice';

export interface AIInsightItem {
    id: string;
    category: InsightCategory;
    severity: InsightSeverity;
    title: string;
    message: string;
    actionableTip?: string;
    metric?: string; // e.g. "+45% vs avg", "₹2,500 over cap", "Due in 3 days"
    relatedReminderId?: string;
    relatedCategory?: string;
}

export interface AIAnalysisResponse {
    insights: AIInsightItem[];
    summary: string;
    healthScore: number; // 0-100 score
    generatedAt: string;
    isConsented: boolean;
}

export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    description: string;
    recurringRuleId?: string;
    reminderId?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}

export interface TransactionReminder {
    id: string;
    userId: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    frequency: Frequency;
    dueDay: number; // Day of month (1-31) or offset
    active: boolean;
    startDate?: string;
}

export type ReminderStatusState = 'pending' | 'paid' | 'skipped' | 'expired';

export interface ReminderStatus {
    id: string;
    reminderId: string;
    userId: string;
    periodKey: string; // e.g., "2026-08"
    status: ReminderStatusState;
    paidTransactionId?: string;
    actualAmount?: number;
    paidDate?: string;
}

export interface MonthlyReminderItem {
    id: string; // reminderId or statusId
    reminderId: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    dueDate: string; // YYYY-MM-DD for current period
    dueDay: number;
    status: ReminderStatusState;
    actualAmount?: number;
    paidDate?: string;
    paidTransactionId?: string;
    daysOverdue?: number;
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
    cap?: number;
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
