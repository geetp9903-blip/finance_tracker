'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    AlertTriangle, 
    TrendingUp, 
    Repeat, 
    Lightbulb, 
    CheckCircle, 
    RefreshCw, 
    ShieldCheck, 
    ArrowRight, 
    ChevronDown, 
    ChevronUp, 
    Zap, 
    Info,
    Clock,
    Flame
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AIConsentModal } from '@/components/ai/AIConsentModal';
import { AIAnalysisResponse, AIInsightItem, InsightCategory, InsightSeverity } from '@/lib/types';

interface AIAgentInsightsWidgetProps {
    currency?: string;
}

export function AIAgentInsightsWidget({ currency = 'INR' }: AIAgentInsightsWidgetProps) {
    const [data, setData] = useState<(AIAnalysisResponse & { hasRunBefore?: boolean; lastGeneratedAt?: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
    const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

    // Countdown timer for rate limiting
    useEffect(() => {
        if (cooldownRemaining <= 0) return;
        const timer = setInterval(() => {
            setCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownRemaining]);

    // Initial load: Only fetches already persisted insights (Zero Gemini API calls)
    const loadStoredInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/insights', { method: 'GET' });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to load AI insights');
            }
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            console.error("Failed to load stored insights:", err);
            setError(err.message || 'An error occurred while loading insights');
        } finally {
            setLoading(false);
        }
    };

    // Explicit Generation: Only runs when the user clicks "Generate New Insights"
    const handleGenerateNewInsights = async () => {
        if (cooldownRemaining > 0 || generating) return;
        setGenerating(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/insights', {
                method: 'POST',
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    setCooldownRemaining(json.cooldownRemaining || 60);
                }
                throw new Error(json.error || 'Failed to generate new AI insights');
            }

            setData(json);
            // Set 60-second cooldown locally after successful generation
            setCooldownRemaining(60);
        } catch (err: any) {
            console.error("Failed to generate insights:", err);
            setError(err.message || 'An error occurred during insight generation');
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        loadStoredInsights();
    }, []);

    // Filter insights
    const filteredInsights = data?.insights?.filter(item => {
        if (selectedCategory === 'all') return true;
        return item.category === selectedCategory;
    }) || [];

    // Severity styling helpers
    const getSeverityBadge = (severity: InsightSeverity) => {
        switch (severity) {
            case 'critical':
                return {
                    bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                    dot: 'bg-rose-500',
                    label: 'Critical Priority'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                    dot: 'bg-amber-500',
                    label: 'Watchlist'
                };
            case 'tip':
                return {
                    bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
                    dot: 'bg-blue-500',
                    label: 'Optimization'
                };
            case 'positive':
                return {
                    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                    dot: 'bg-emerald-500',
                    label: 'Win'
                };
            default:
                return {
                    bg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
                    dot: 'bg-zinc-500',
                    label: 'Note'
                };
        }
    };

    const getCategoryIcon = (category: InsightCategory) => {
        switch (category) {
            case 'cashflow_risk':
                return <AlertTriangle className="w-4 h-4 text-rose-400" />;
            case 'category_spike':
                return <TrendingUp className="w-4 h-4 text-amber-400" />;
            case 'subscription_creep':
                return <Repeat className="w-4 h-4 text-purple-400" />;
            case 'budget_burndown':
                return <Zap className="w-4 h-4 text-cyan-400" />;
            case 'general_advice':
            default:
                return <Lightbulb className="w-4 h-4 text-emerald-400" />;
        }
    };

    // Health score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    };

    // Format timestamp nicely
    const formatTimestamp = (dateStr?: string | null) => {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch {
            return null;
        }
    };

    // State 1: Consent Required / Disabled State
    if (!loading && data && !data.isConsented) {
        return (
            <>
                <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-zinc-900/90 via-purple-950/20 to-zinc-900/90 backdrop-blur-xl shadow-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Sparkles className="w-48 h-48 text-purple-400" />
                    </div>
                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                                Prospera AI Analytical Agent
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
                                Unlock Intelligent Spending & Cashflow Insights
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Get proactive alerts on category spending surges, upcoming bill cashflow crunches, subscription creep audits, and personalized budget adjustments powered by Gemini AI.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" /> Zero-PII Sanitized
                                </span>
                                <span className="flex items-center gap-1.5 text-zinc-400">
                                    • Opt-in by default
                                </span>
                                <span className="flex items-center gap-1.5 text-zinc-400">
                                    • Revoke anytime in Settings
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                            <Button
                                onClick={() => setIsConsentModalOpen(true)}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 group transition-all"
                            >
                                <span>Enable AI Insights</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <AIConsentModal
                    isOpen={isConsentModalOpen}
                    onClose={() => setIsConsentModalOpen(false)}
                    onConsentSuccess={() => loadStoredInsights()}
                />
            </>
        );
    }

    const hasStoredInsights = data && data.insights && data.insights.length > 0;
    const formattedLastGenerated = formatTimestamp(data?.lastGeneratedAt || data?.generatedAt);

    return (
        <>
            <Card className="border-purple-500/20 bg-zinc-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader className="p-5 md:p-6 pb-4 border-b border-zinc-800/80">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg font-bold text-zinc-100">AI Analytical Advisor</CardTitle>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        Gemini Active
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <span>Proactive pattern recognition & liquidity protection</span>
                                    {formattedLastGenerated && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-zinc-400">
                                                <Clock className="w-3 h-3 text-purple-400" />
                                                Last: {formattedLastGenerated}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Health Gauge */}
                        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
                            {hasStoredInsights && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${getScoreColor(data.healthScore)}`}>
                                    <span>Financial Health:</span>
                                    <span className="text-sm font-bold">{data.healthScore}/100</span>
                                </div>
                            )}

                            {/* Generate New Insights Button with Cooldown Handling */}
                            <Button
                                size="sm"
                                onClick={handleGenerateNewInsights}
                                disabled={loading || generating || cooldownRemaining > 0}
                                className={`h-9 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-md ${
                                    cooldownRemaining > 0
                                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                                }`}
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                                <span>
                                    {generating
                                        ? 'Analyzing Data...'
                                        : cooldownRemaining > 0
                                        ? `Cooldown (${cooldownRemaining}s)`
                                        : hasStoredInsights
                                        ? 'Generate New Insights'
                                        : 'Generate Insights'}
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Executive Summary Quote */}
                    {data?.summary && !loading && (
                        <div className="mt-4 p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <p>{data.summary}</p>
                        </div>
                    )}

                    {/* Filter Category Chips */}
                    {hasStoredInsights && !loading && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-none">
                            {[
                                { id: 'all', label: 'All Insights' },
                                { id: 'cashflow_risk', label: 'Cashflow & Bills' },
                                { id: 'category_spike', label: 'Category Spikes' },
                                { id: 'subscription_creep', label: 'Subscriptions' },
                                { id: 'budget_burndown', label: 'Budget & Caps' },
                                { id: 'general_advice', label: 'Actionable Tips' },
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                        selectedCategory === cat.id
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                            : 'bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-zinc-800'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-5 md:p-6 space-y-3">
                    {/* Generating Shimmer State */}
                    {generating && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                                <Sparkles className="w-5 h-5 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-zinc-200">Evaluating Financial Posture...</h4>
                                <p className="text-xs text-zinc-400">Comparing category velocity, upcoming scheduled bills, and liquid cash reserves</p>
                            </div>
                        </div>
                    )}

                    {/* Initial Loading (just reading stored data) */}
                    {loading && !generating && (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-xs text-zinc-500">
                            <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                            <span>Loading stored insights...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && !generating && error && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
                            <span>{error}</span>
                            <Button size="sm" variant="ghost" onClick={handleGenerateNewInsights} className="text-xs text-rose-300 hover:text-rose-200 shrink-0">
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Empty State when no insights generated yet */}
                    {!loading && !generating && !error && (!data?.insights || data.insights.length === 0) && (
                        <div className="py-10 text-center space-y-4">
                            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mx-auto">
                                <Flame className="w-8 h-8" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h4 className="text-sm font-semibold text-zinc-200">Ready to Analyze Your Finances</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Click the button below to run an instant analysis on your spending categories, bills watchlist, and cashflow health.
                                </p>
                            </div>
                            <Button
                                onClick={handleGenerateNewInsights}
                                disabled={cooldownRemaining > 0}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-lg shadow-purple-600/25"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-2" />
                                Generate New Insights
                            </Button>
                        </div>
                    )}

                    {/* Insights List */}
                    {!loading && !generating && !error && filteredInsights.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            <AnimatePresence mode="popLayout">
                                {filteredInsights.map((insight) => {
                                    const badge = getSeverityBadge(insight.severity);
                                    const isExpanded = expandedInsightId === insight.id;

                                    return (
                                        <motion.div
                                            key={insight.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`rounded-xl border transition-all ${
                                                insight.severity === 'critical'
                                                    ? 'bg-rose-950/20 border-rose-500/30'
                                                    : insight.severity === 'warning'
                                                    ? 'bg-amber-950/20 border-amber-500/30'
                                                    : 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div 
                                                onClick={() => setExpandedInsightId(isExpanded ? null : insight.id)}
                                                className="p-4 cursor-pointer flex items-start justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 mt-0.5 shrink-0">
                                                        {getCategoryIcon(insight.category)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-semibold text-zinc-100">{insight.title}</h4>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                                {badge.label}
                                                            </span>
                                                            {insight.metric && (
                                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-300">
                                                                    {insight.metric}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                                            {insight.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button className="text-zinc-500 hover:text-zinc-300 p-1 shrink-0">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            {/* Actionable Tip Accordion */}
                                            {insight.actionableTip && isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="px-4 pb-4 pt-1 border-t border-zinc-800/60 bg-zinc-900/30 rounded-b-xl"
                                                >
                                                    <div className="flex items-start gap-2 text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg mt-2">
                                                        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                                                        <div>
                                                            <span className="font-semibold text-emerald-300">Recommended Action: </span>
                                                            {insight.actionableTip}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Filter empty state */}
                    {!loading && !generating && !error && hasStoredInsights && filteredInsights.length === 0 && (
                        <div className="py-8 text-center text-xs text-zinc-500 space-y-1">
                            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/60" />
                            <p className="font-semibold text-zinc-400">No issues detected for this filter</p>
                            <p>Your spending and payment schedule in this category are on track.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AIConsentModal
                isOpen={isConsentModalOpen}
                onClose={() => setIsConsentModalOpen(false)}
                onConsentSuccess={() => loadStoredInsights()}
            />
        </>
    );
}
