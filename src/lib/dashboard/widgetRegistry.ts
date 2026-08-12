import { WidgetConfig, DashboardLayoutSettings } from "@/lib/types";

export interface WidgetMetadata {
    id: string;
    title: string;
    description: string;
    category: 'core' | 'analytics' | 'planning';
    defaultEnabled: boolean;
    defaultColSpan: number;
    minColSpan: number;
    maxColSpan: number;
}

export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
    quick_stats: {
        id: 'quick_stats',
        title: 'Quick Stats Metrics',
        description: 'Total Income, Expenses, Net Balance, and Active Reminders banner cards',
        category: 'core',
        defaultEnabled: true,
        defaultColSpan: 12,
        minColSpan: 6,
        maxColSpan: 12,
    },
    predictive_cashflow: {
        id: 'predictive_cashflow',
        title: 'Cashflow Forecast Chart',
        description: 'Dual series line chart for actual historical balance vs projected future cashflow',
        category: 'planning',
        defaultEnabled: true,
        defaultColSpan: 7,
        minColSpan: 4,
        maxColSpan: 12,
    },
    pending_reminders: {
        id: 'pending_reminders',
        title: 'Pending Reminders Tab',
        description: 'Monthly scheduled transactions list with quick Mark as Paid action',
        category: 'planning',
        defaultEnabled: true,
        defaultColSpan: 5,
        minColSpan: 3,
        maxColSpan: 12,
    },
    spending_analysis: {
        id: 'spending_analysis',
        title: 'Spending Analysis Bar Chart',
        description: 'Monthly/Annual spending bar chart filtered by category',
        category: 'analytics',
        defaultEnabled: true,
        defaultColSpan: 7,
        minColSpan: 4,
        maxColSpan: 12,
    },
    recent_transactions: {
        id: 'recent_transactions',
        title: 'Recent Transactions Card',
        description: 'Scrollable list of recent actual logged transactions',
        category: 'core',
        defaultEnabled: true,
        defaultColSpan: 5,
        minColSpan: 3,
        maxColSpan: 12,
    },
    top_categories: {
        id: 'top_categories',
        title: 'Top Categories Breakdown',
        description: 'Pie/bar distribution of top spending categories',
        category: 'analytics',
        defaultEnabled: false,
        defaultColSpan: 6,
        minColSpan: 3,
        maxColSpan: 12,
    },
    category_stacked: {
        id: 'category_stacked',
        title: 'Category Stacked Area Chart',
        description: 'Multi-category stacked spending trajectory over time',
        category: 'analytics',
        defaultEnabled: false,
        defaultColSpan: 12,
        minColSpan: 6,
        maxColSpan: 12,
    },
    balance_depletion: {
        id: 'balance_depletion',
        title: 'Balance Depletion Pool',
        description: 'Visualizes pool depletion rate against period expenses',
        category: 'analytics',
        defaultEnabled: false,
        defaultColSpan: 6,
        minColSpan: 4,
        maxColSpan: 12,
    },
    pareto_analysis: {
        id: 'pareto_analysis',
        title: 'Pareto 80/20 Rule Analysis',
        description: 'Calculates the 20% categories responsible for 80% of spending',
        category: 'analytics',
        defaultEnabled: false,
        defaultColSpan: 6,
        minColSpan: 4,
        maxColSpan: 12,
    },
    category_trend: {
        id: 'category_trend',
        title: 'Category Trend Analysis',
        description: 'Multi-month trend analysis for specific expense categories',
        category: 'analytics',
        defaultEnabled: false,
        defaultColSpan: 6,
        minColSpan: 4,
        maxColSpan: 12,
    },
    budget_burndown: {
        id: 'budget_burndown',
        title: 'Budget Burndown Chart',
        description: 'Daily budget burndown target vs actual spend rate',
        category: 'planning',
        defaultEnabled: false,
        defaultColSpan: 6,
        minColSpan: 4,
        maxColSpan: 12,
    },
};

export const PRESET_LAYOUTS: Record<string, { title: string; description: string; settings: DashboardLayoutSettings }> = {
    default: {
        title: "Default Balanced View",
        description: "Metrics, Cashflow Forecast, Pending Reminders, Spending Bar, and Recent Transactions",
        settings: {
            preset: 'default',
            widgets: [
                { id: 'quick_stats', enabled: true, colSpan: 12, order: 1 },
                { id: 'predictive_cashflow', enabled: true, colSpan: 7, order: 2 },
                { id: 'pending_reminders', enabled: true, colSpan: 5, order: 3 },
                { id: 'spending_analysis', enabled: true, colSpan: 7, order: 4 },
                { id: 'recent_transactions', enabled: true, colSpan: 5, order: 5 },
            ],
        },
    },
    analytics: {
        title: "Analytics Heavy",
        description: "Deep dive into category stacked area, Pareto 80/20, trends, and depletion charts",
        settings: {
            preset: 'analytics',
            widgets: [
                { id: 'quick_stats', enabled: true, colSpan: 12, order: 1 },
                { id: 'category_stacked', enabled: true, colSpan: 12, order: 2 },
                { id: 'spending_analysis', enabled: true, colSpan: 6, order: 3 },
                { id: 'top_categories', enabled: true, colSpan: 6, order: 4 },
                { id: 'category_trend', enabled: true, colSpan: 6, order: 5 },
                { id: 'pareto_analysis', enabled: true, colSpan: 6, order: 6 },
            ],
        },
    },
    reminders_cashflow: {
        title: "Cashflow & Reminders Focus",
        description: "Full-width cashflow forecasting, pending scheduled payments, and quick stats",
        settings: {
            preset: 'reminders_cashflow',
            widgets: [
                { id: 'quick_stats', enabled: true, colSpan: 12, order: 1 },
                { id: 'predictive_cashflow', enabled: true, colSpan: 12, order: 2 },
                { id: 'pending_reminders', enabled: true, colSpan: 6, order: 3 },
                { id: 'recent_transactions', enabled: true, colSpan: 6, order: 4 },
            ],
        },
    },
    minimal: {
        title: "Minimalist Essentials",
        description: "Clean overview featuring Quick Stats, Recent Transactions, and Pending Reminders",
        settings: {
            preset: 'minimal',
            widgets: [
                { id: 'quick_stats', enabled: true, colSpan: 12, order: 1 },
                { id: 'recent_transactions', enabled: true, colSpan: 6, order: 2 },
                { id: 'pending_reminders', enabled: true, colSpan: 6, order: 3 },
            ],
        },
    },
};

export function getDefaultDashboardLayout(): DashboardLayoutSettings {
    return PRESET_LAYOUTS.default.settings;
}
