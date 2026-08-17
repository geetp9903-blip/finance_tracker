'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Lock, ArrowRight, X, ExternalLink, Loader2 } from 'lucide-react';
import { AIPrivacyPolicyModal } from './AIPrivacyPolicyModal';

interface AIConsentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConsentSuccess: () => void;
}

export function AIConsentModal({ isOpen, onClose, onConsentSuccess }: AIConsentModalProps) {
    const [loading, setLoading] = useState(false);
    const [showFullPolicy, setShowFullPolicy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleEnable = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/user/ai-consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: true }),
            });

            if (!res.ok) {
                throw new Error("Failed to save consent. Please try again.");
            }

            onConsentSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
                <div 
                    className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-purple-500/30 shadow-[0_0_50px_-12px_rgba(168,85,247,0.25)] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">Prospera AI Intelligence</h3>
                                <p className="text-xs text-purple-300 font-medium">Smart Analytical & Cashflow Advisor</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4 space-y-4 text-sm text-zinc-300">
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            Activate an intelligent financial analyst that continuously monitors your spending velocity, flags category spikes, and predicts upcoming bill crunches.
                        </p>

                        <div className="grid grid-cols-1 gap-2.5">
                            <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-100">Zero-PII Privacy Protection</h4>
                                    <p className="text-[11px] text-zinc-400">Emails, names, and credentials are completely removed before analysis.</p>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-100">Impending Bill & Cashflow Warnings</h4>
                                    <p className="text-[11px] text-zinc-400">Correlates your liquid balance with upcoming reminders to prevent shortfalls.</p>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-start gap-3">
                                <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-100">Full User Control</h4>
                                    <p className="text-[11px] text-zinc-400">You can toggle this off anytime in Settings to instantly wipe cached insights.</p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowFullPolicy(true)}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 underline-offset-2 hover:underline transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Read Full Terms & AI Data Processing Policy
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pt-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium hover:bg-zinc-800/50 transition-colors"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Enabling AI...
                                </>
                            ) : (
                                <>
                                    <span>Accept & Enable AI</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Policy Modal */}
            <AIPrivacyPolicyModal
                isOpen={showFullPolicy}
                onClose={() => setShowFullPolicy(false)}
            />
        </>
    );
}
