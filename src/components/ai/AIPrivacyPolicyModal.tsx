'use client';

import React from 'react';
import { ShieldCheck, Lock, EyeOff, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface AIPrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIPrivacyPolicyModal({ isOpen, onClose }: AIPrivacyPolicyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div 
                className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">AI Privacy & Data Processing Policy</h2>
                            <p className="text-xs text-zinc-400">Prospera AI Intelligence • Version 1.0</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
                    {/* Summary Banner */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 text-emerald-300">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-emerald-200">Zero Personally Identifiable Information (PII) Transmission</h4>
                            <p className="text-xs mt-1 text-emerald-300/90">
                                Your personal identity (email, username, PIN, OTP, bank account numbers) is never sent to the AI model. Only sanitized numerical spending metrics and category totals are analyzed.
                            </p>
                        </div>
                    </div>

                    <section className="space-y-2">
                        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            1. How the AI Analytical Agent Works
                        </h3>
                        <p className="leading-relaxed text-zinc-400">
                            Prospera uses advanced large language model reasoning (Google Gemini) to analyze your spending velocity, identify unusual category surges, detect subscription creep, and cross-reference upcoming scheduled bill reminders with your current liquid cash balance to prevent overdrafts or cash crunches.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                            <EyeOff className="w-4 h-4 text-blue-400" />
                            2. Data Sanitization & Stripping
                        </h3>
                        <p className="leading-relaxed text-zinc-400">
                            Before any request leaves your secure instance, our PII Sanitizer strips:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-xs">
                            <li>Your username, email address, password/PIN hash, and TOTP secrets.</li>
                            <li>Personal notes, merchant identifiers, or account numbers embedded in transaction memos.</li>
                            <li>Only aggregated category totals, transaction counts, relative dates, and bill amounts are forwarded for numerical reasoning.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400" />
                            3. User Consent & Opt-In Control
                        </h3>
                        <p className="leading-relaxed text-zinc-400">
                            AI analytics are <strong>opt-in only</strong>. You retain absolute control over this capability. You may enable or disable AI analytics at any time directly in your Prospera Settings. When disabled, all cached AI insight summaries are immediately deleted and no background data processing takes place.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-base font-semibold text-zinc-100">4. Third-Party AI Service Provider</h3>
                        <p className="leading-relaxed text-zinc-400">
                            The analytical reasoning is performed via Google Gemini's API endpoints. Google's API data governance stipulates that customer data submitted via the enterprise/developer API is not used to train base foundation models without explicit consent.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors text-sm"
                    >
                        Close Policy
                    </button>
                </div>
            </div>
        </div>
    );
}
