"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { WIDGET_REGISTRY, PRESET_LAYOUTS, WidgetMetadata } from "@/lib/dashboard/widgetRegistry";
import { WidgetConfig, DashboardLayoutSettings } from "@/lib/types";
import { Check, LayoutGrid, Sparkles, SlidersHorizontal, Plus, Trash2 } from "lucide-react";

interface WidgetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLayout: DashboardLayoutSettings;
    onApplyLayout: (newLayout: DashboardLayoutSettings) => void;
    onApplyPreset: (presetKey: string) => void;
}

export function WidgetSelectorModal({
    isOpen,
    onClose,
    currentLayout,
    onApplyLayout,
    onApplyPreset,
}: WidgetSelectorModalProps) {
    const activeWidgetIds = new Set(currentLayout.widgets.filter(w => w.enabled).map(w => w.id));

    const toggleWidget = (widgetId: string) => {
        let newWidgets = [...currentLayout.widgets];
        const existingIndex = newWidgets.findIndex(w => w.id === widgetId);

        if (existingIndex >= 0) {
            newWidgets[existingIndex] = {
                ...newWidgets[existingIndex],
                enabled: !newWidgets[existingIndex].enabled,
            };
        } else {
            const meta = WIDGET_REGISTRY[widgetId];
            newWidgets.push({
                id: widgetId,
                enabled: true,
                colSpan: meta?.defaultColSpan || 6,
                order: newWidgets.length + 1,
            });
        }

        onApplyLayout({
            preset: 'custom',
            widgets: newWidgets,
        });
    };

    const categories = [
        { key: 'core', label: 'Core Dashboard' },
        { key: 'planning', label: 'Planning & Forecast' },
        { key: 'analytics', label: 'Analytics & Trends' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard Structure">
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                {/* Presets Section */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary" /> Preset Layout Templates
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(PRESET_LAYOUTS).map(([key, preset]) => {
                            const isCurrent = currentLayout.preset === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        onApplyPreset(key);
                                        onClose();
                                    }}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        isCurrent
                                            ? 'bg-primary/15 border-primary text-foreground shadow-sm'
                                            : 'bg-card/50 border-border/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm text-foreground">{preset.title}</span>
                                        {isCurrent && <Check className="w-4 h-4 text-primary" />}
                                    </div>
                                    <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{preset.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-primary" /> Widget Selector & Toggles
                    </h3>

                    <div className="space-y-5">
                        {categories.map((cat) => {
                            const catWidgets = Object.values(WIDGET_REGISTRY).filter(w => w.category === cat.key);
                            if (catWidgets.length === 0) return null;

                            return (
                                <div key={cat.key} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-foreground/80">{cat.label}</h4>
                                    <div className="space-y-2">
                                        {catWidgets.map((meta) => {
                                            const isEnabled = activeWidgetIds.has(meta.id);
                                            return (
                                                <div
                                                    key={meta.id}
                                                    onClick={() => toggleWidget(meta.id)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                        isEnabled
                                                            ? 'bg-card border-primary/40 shadow-sm'
                                                            : 'bg-muted/20 border-border/40 opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm text-foreground">{meta.title}</span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-muted-foreground font-mono">
                                                                {meta.defaultColSpan}/12 Col
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                                                    </div>

                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                                        isEnabled ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent border-input'
                                                    }`}>
                                                        {isEnabled && <Check className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/50">
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Done Customizing
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
