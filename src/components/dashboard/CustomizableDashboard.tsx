"use client";

import { useState, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { DashboardLayoutSettings, WidgetConfig } from "@/lib/types";
import { WIDGET_REGISTRY, PRESET_LAYOUTS, getDefaultDashboardLayout } from "@/lib/dashboard/widgetRegistry";
import { saveDashboardLayout, applyPresetLayout } from "@/lib/actions/dashboardLayout";
import { WidgetSelectorModal } from "./WidgetSelectorModal";
import { QuickStats } from "./QuickStats";
import { PredictiveBalanceChart } from "@/components/charts/PredictiveBalanceChart";
import { PendingRemindersCard } from "./PendingRemindersCard";
import { TransactionManager } from "@/components/finance/TransactionManager";
import { Button } from "@/components/ui/Button";
import {
    SlidersHorizontal,
    Sparkles,
    RotateCcw,
    Save,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    ArrowUp,
    ArrowDown,
    Loader2,
} from "lucide-react";

// Dynamic imports for heavy analytics charts
const SpendingBarChart = dynamic(
    () => import("@/components/charts/SpendingBarChart").then(mod => mod.SpendingBarChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

const TopCategoriesChart = dynamic(
    () => import("@/components/charts/TopCategoriesChart").then(mod => mod.TopCategoriesChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

const CategoryStackedAreaChart = dynamic(
    () => import("@/components/charts/CategoryStackedAreaChart").then(mod => mod.CategoryStackedAreaChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

const BalanceDepletionChart = dynamic(
    () => import("@/components/charts/BalanceDepletionChart").then(mod => mod.BalanceDepletionChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

const ParetoChart = dynamic(
    () => import("@/components/analytics/ParetoChart").then(mod => mod.ParetoChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

const CategoryTrendChart = dynamic(
    () => import("@/components/analytics/CategoryTrendChart").then(mod => mod.CategoryTrendChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

const BudgetBurndownChart = dynamic(
    () => import("@/components/analytics/BudgetBurndownChart").then(mod => mod.BudgetBurndownChart),
    { ssr: false, loading: () => <div className="h-[400px] w-full bg-card/40 animate-pulse rounded-xl" /> }
);

interface CustomizableDashboardProps {
    initialLayout: DashboardLayoutSettings;
    spendingData: any[];
    topCategoriesData: any[];
    predictiveData: any;
    monthlyRemindersData: any[];
    sanitizedTransactions: any[];
    allTransactions?: any[];
    currency: string;
    periodLabel: string;
    periodKey: string;
}

export function CustomizableDashboard({
    initialLayout,
    spendingData,
    topCategoriesData,
    predictiveData,
    monthlyRemindersData,
    sanitizedTransactions,
    allTransactions = [],
    currency = 'INR',
    periodLabel,
    periodKey,
}: CustomizableDashboardProps) {
    const [layout, setLayout] = useState<DashboardLayoutSettings>(initialLayout || getDefaultDashboardLayout());
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    const [isPending, startTransition] = useTransition();

    const formatter = useMemo(() => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
    }), [currency]);

    const formatAmount = (val: number) => formatter.format(val);

    // Active enabled widgets sorted by order
    const activeWidgets = useMemo(() => {
        return [...layout.widgets]
            .filter(w => w.enabled)
            .sort((a, b) => a.order - b.order);
    }, [layout]);

    const handleSaveLayout = async () => {
        setSaveStatus("");
        startTransition(async () => {
            const res = await saveDashboardLayout(layout);
            setSaveStatus(res.message);
            if (res.success) {
                setIsEditMode(false);
            }
        });
    };

    const handleApplyPreset = (presetKey: string) => {
        const preset = PRESET_LAYOUTS[presetKey];
        if (preset) {
            setLayout(preset.settings);
            startTransition(async () => {
                await applyPresetLayout(presetKey);
            });
        }
    };

    const handleReset = () => {
        handleApplyPreset('default');
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newActive = [...activeWidgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newActive.length) return;

        const tempOrder = newActive[index].order;
        newActive[index].order = newActive[targetIndex].order;
        newActive[targetIndex].order = tempOrder;

        const widgetMap = new Map(newActive.map(w => [w.id, w]));
        const updatedWidgets = layout.widgets.map(w => widgetMap.get(w.id) || w);

        setLayout({
            ...layout,
            preset: 'custom',
            widgets: updatedWidgets,
        });
    };

    const resizeWidgetWidth = (id: string, delta: number) => {
        const meta = WIDGET_REGISTRY[id];
        const minSpan = meta?.minColSpan || 3;
        const maxSpan = meta?.maxColSpan || 12;

        const updatedWidgets = layout.widgets.map(w => {
            if (w.id === id) {
                const newSpan = Math.min(Math.max(w.colSpan + delta, minSpan), maxSpan);
                return { ...w, colSpan: newSpan };
            }
            return w;
        });

        setLayout({
            ...layout,
            preset: 'custom',
            widgets: updatedWidgets,
        });
    };

    const resizeWidgetHeight = (id: string, deltaPx: number) => {
        const updatedWidgets = layout.widgets.map(w => {
            if (w.id === id) {
                const currentH = w.heightPx || 460;
                const newHeight = Math.min(Math.max(currentH + deltaPx, 320), 650);
                return { ...w, heightPx: newHeight };
            }
            return w;
        });

        setLayout({
            ...layout,
            preset: 'custom',
            widgets: updatedWidgets,
        });
    };

    const removeWidget = (id: string) => {
        const updatedWidgets = layout.widgets.map(w => {
            if (w.id === id) return { ...w, enabled: false };
            return w;
        });

        setLayout({
            ...layout,
            preset: 'custom',
            widgets: updatedWidgets,
        });
    };

    // Helper map to render corresponding widget component
    const renderWidgetComponent = (widgetId: string) => {
        switch (widgetId) {
            case 'quick_stats':
                return (
                    <QuickStats
                        balance={predictiveData.currentBalance}
                        income={predictiveData.totalActualIncome !== undefined ? predictiveData.totalActualIncome : (predictiveData.totalIncome || 0)}
                        expense={predictiveData.totalActualExpenses !== undefined ? predictiveData.totalActualExpenses : (predictiveData.totalPaidExpenses || 0)}
                        transactionCount={sanitizedTransactions.length}
                        currency={currency}
                        periodLabel={periodLabel}
                    />
                );

            case 'predictive_cashflow':
                return (
                    <PredictiveBalanceChart
                        data={predictiveData.chartPoints}
                        currentBalance={predictiveData.currentBalance}
                        totalPaidExpenses={predictiveData.totalPaidExpenses}
                        totalPendingExpenses={predictiveData.totalPendingExpenses}
                        totalPendingIncome={predictiveData.totalPendingIncome}
                        periodLabel={periodLabel}
                        currency={currency}
                    />
                );

            case 'pending_reminders':
                return (
                    <PendingRemindersCard
                        reminders={monthlyRemindersData}
                        currency={currency}
                        periodKey={periodKey}
                    />
                );

            case 'spending_analysis':
                return (
                    <SpendingBarChart
                        data={spendingData}
                        periodLabel={periodLabel}
                        currency={currency}
                        budget={2500}
                    />
                );

            case 'recent_transactions':
                return (
                    <TransactionManager
                        initialTransactions={sanitizedTransactions}
                        currency={currency}
                    />
                );

            case 'top_categories':
                return (
                    <TopCategoriesChart
                        data={topCategoriesData}
                        currency={currency}
                    />
                );

            case 'category_stacked':
                return (
                    <CategoryStackedAreaChart
                        data={[]}
                        periodTotalExpenses={predictiveData.totalPaidExpenses}
                        currency={currency}
                    />
                );

            case 'balance_depletion':
                return (
                    <BalanceDepletionChart
                        data={spendingData}
                        currentGlobalBalance={predictiveData.currentBalance}
                        periodTotalExpenses={predictiveData.totalPaidExpenses}
                        periodLabel={periodLabel}
                        currency={currency}
                    />
                );

            case 'pareto_analysis':
                return (
                    <ParetoChart
                        transactions={allTransactions}
                        formatAmount={formatAmount}
                    />
                );

            case 'category_trend':
                return (
                    <CategoryTrendChart
                        transactions={allTransactions}
                        formatAmount={formatAmount}
                    />
                );

            case 'budget_burndown':
                return (
                    <BudgetBurndownChart
                        transactions={allTransactions}
                        budget={{ fixedExpenses: [], allocations: [] }}
                        formatAmount={formatAmount}
                    />
                );

            default:
                return null;
        }
    };

    // Helper tailwind class mapping for grid colSpan
    const getColSpanClass = (span: number) => {
        switch (span) {
            case 12: return 'md:col-span-12';
            case 11: return 'md:col-span-11';
            case 10: return 'md:col-span-10';
            case 9: return 'md:col-span-9';
            case 8: return 'md:col-span-8';
            case 7: return 'md:col-span-7';
            case 6: return 'md:col-span-6';
            case 5: return 'md:col-span-5';
            case 4: return 'md:col-span-4';
            case 3: return 'md:col-span-3';
            default: return 'md:col-span-6';
        }
    };

    return (
        <div className="space-y-6">
            {/* Dashboard Customization Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl glass-card border border-border/60">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Dashboard Customization</h3>
                        <p className="text-xs text-muted-foreground">
                            {isEditMode ? 'Use stationary left-anchored controls to adjust width & length (height)' : 'Personalize your view layout & widgets'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {!isEditMode ? (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsModalOpen(true)}
                                className="text-xs h-8 gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> Toggle Widgets
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => setIsEditMode(true)}
                                className="text-xs h-8 gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" /> Customize Layout & Sizes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsModalOpen(true)}
                                className="text-xs h-8 gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Widgets
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleReset}
                                disabled={isPending}
                                className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Reset
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleSaveLayout}
                                disabled={isPending}
                                className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                            >
                                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Save Layout
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {saveStatus && (
                <p className="text-xs font-medium text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    {saveStatus}
                </p>
            )}

            {/* Responsive 12-Column Grid Container */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {activeWidgets.map((w, index) => {
                    const meta = WIDGET_REGISTRY[w.id];
                    const currentHeight = w.heightPx || (w.id === 'quick_stats' ? undefined : 460);

                    return (
                        <div
                            key={w.id}
                            style={currentHeight ? { height: `${currentHeight}px` } : undefined}
                            className={`col-span-1 ${getColSpanClass(w.colSpan)} relative group transition-all duration-200 flex flex-col ${
                                isEditMode ? 'p-2.5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 shadow-xl' : ''
                            }`}
                        >
                            {/* Left-Anchored Stationary Edit Controls Bar */}
                            {isEditMode && (
                                <div className="mb-2 p-2 rounded-xl bg-card border border-border shadow-md flex flex-wrap items-center justify-start gap-2 z-20 text-xs shrink-0">
                                    {/* Left Title & Info */}
                                    <div className="flex items-center gap-1.5 font-semibold text-foreground mr-2">
                                        <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                                        <span>{meta?.title || w.id}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-accent">
                                            {w.colSpan}/12 W • {currentHeight ? `${currentHeight}px H` : 'Auto'}
                                        </span>
                                    </div>

                                    {/* Stationary Action Controls Group (Left-Anchored) */}
                                    <div className="flex items-center gap-1 bg-accent/40 p-1 rounded-lg border border-border/50">
                                        {/* Order Up/Left */}
                                        <button
                                            onClick={() => moveWidget(index, 'up')}
                                            disabled={index === 0}
                                            title="Move Up/Left"
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>

                                        {/* Order Down/Right */}
                                        <button
                                            onClick={() => moveWidget(index, 'down')}
                                            disabled={index === activeWidgets.length - 1}
                                            title="Move Down/Right"
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>

                                        <span className="w-px h-3 bg-border mx-0.5"></span>

                                        {/* Stationary Width Controls (- W / + W) */}
                                        <button
                                            onClick={() => resizeWidgetWidth(w.id, -1)}
                                            disabled={w.colSpan <= (meta?.minColSpan || 3)}
                                            title="Shrink Width"
                                            className="px-2 py-0.5 rounded hover:bg-accent font-semibold text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5"
                                        >
                                            <Minimize2 className="w-3 h-3" /> -W
                                        </button>

                                        <button
                                            onClick={() => resizeWidgetWidth(w.id, 1)}
                                            disabled={w.colSpan >= (meta?.maxColSpan || 12)}
                                            title="Expand Width"
                                            className="px-2 py-0.5 rounded hover:bg-accent font-semibold text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5"
                                        >
                                            <Maximize2 className="w-3 h-3" /> +W
                                        </button>

                                        {/* Stationary Height Controls (- H / + H) */}
                                        {w.id !== 'quick_stats' && (
                                            <>
                                                <span className="w-px h-3 bg-border mx-0.5"></span>

                                                <button
                                                    onClick={() => resizeWidgetHeight(w.id, -40)}
                                                    disabled={(w.heightPx || 460) <= 320}
                                                    title="Decrease Length / Height"
                                                    className="px-2 py-0.5 rounded hover:bg-accent font-semibold text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5"
                                                >
                                                    <ArrowUp className="w-3 h-3" /> -H
                                                </button>

                                                <button
                                                    onClick={() => resizeWidgetHeight(w.id, 40)}
                                                    disabled={(w.heightPx || 460) >= 650}
                                                    title="Increase Length / Height"
                                                    className="px-2 py-0.5 rounded hover:bg-accent font-semibold text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-0.5"
                                                >
                                                    <ArrowDown className="w-3 h-3" /> +H
                                                </button>
                                            </>
                                        )}

                                        <span className="w-px h-3 bg-border mx-0.5"></span>

                                        {/* Remove Widget */}
                                        <button
                                            onClick={() => removeWidget(w.id)}
                                            title="Hide Widget"
                                            className="p-1 rounded hover:bg-destructive/20 text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Render Widget */}
                            <div className="w-full h-full flex-1 overflow-hidden">
                                {renderWidgetComponent(w.id)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Widget Selector Modal */}
            <WidgetSelectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentLayout={layout}
                onApplyLayout={(newLayout) => setLayout(newLayout)}
                onApplyPreset={handleApplyPreset}
            />
        </div>
    );
}
