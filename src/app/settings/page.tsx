"use client";

import { useTheme } from "@/context/ThemeContext";
import { Card } from "@/components/ui/Card";
import { Moon, Sun, Droplets, Layers, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { bgStyle, setBgStyle, glassStyle, setGlassStyle } = useTheme();

    return (
        <div className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Background Style */}
                <Card className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Background</h2>
                            <p className="text-sm text-muted-foreground">Toggle animated liquid background</p>
                        </div>
                    </div>

                    <div className="flex bg-accent/50 p-1 rounded-xl">
                        <button
                            onClick={() => setBgStyle('static')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                bgStyle === 'static' ? "bg-accent text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="h-4 w-4" /> Static
                        </button>
                        <button
                            onClick={() => setBgStyle('liquid')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                bgStyle === 'liquid' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Droplets className="h-4 w-4" /> Liquid
                        </button>
                    </div>
                </Card>

                {/* Glass Effect */}
                <Card className="glass-card p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Glass Effect</h2>
                            <p className="text-sm text-muted-foreground">Customize the glassmorphism style</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setGlassStyle('frost')}
                            className={cn(
                                "relative overflow-hidden p-4 rounded-xl border transition-all duration-300 text-left group",
                                glassStyle === 'frost' ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                            )}
                        >
                            <div className="absolute inset-0 bg-accent/50 backdrop-blur-xl" />
                            <div className="relative z-10">
                                <h3 className="font-medium text-foreground mb-1">Classic Frost</h3>
                                <p className="text-xs text-muted-foreground">Matte finish, high blur, standard border. The classic iOS look.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setGlassStyle('liquid')}
                            className={cn(
                                "relative overflow-hidden p-4 rounded-xl border transition-all duration-300 text-left group",
                                glassStyle === 'liquid' ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                            )}
                        >
                            {/* Preview of Liquid Style inside the button */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md" />
                            <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />

                            <div className="relative z-10">
                                <h3 className="font-medium text-foreground mb-1">Liquid Gloss</h3>
                                <p className="text-xs text-muted-foreground">Refractive edges, wet look, prismatic shadows. Premium feel.</p>
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Profile Security Settings */}
                <ProfileSecuritySettings />

                {/* AI & Privacy Intelligence Settings */}
                <AIPrivacySettings />
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Shield, Key, Mail, Edit3, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { AIConsentModal } from "@/components/ai/AIConsentModal";
import { AIPrivacyPolicyModal } from "@/components/ai/AIPrivacyPolicyModal";

function ProfileSecuritySettings() {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Forms
    const [newUsername, setNewUsername] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [authPin, setAuthPin] = useState(''); // For email update

    // PIN Update Flow
    const [pinFlowStep, setPinFlowStep] = useState(0); // 0: Start, 1: Verify OTP, 2: New PIN
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');

    const handleUpdate = async (type: 'username' | 'email', value: string, authorization?: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/profile/update', {
                method: 'POST',
                body: JSON.stringify({ type, value, authorization }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                addToast(data.message || 'Updated successfully', 'success');
                if (type === 'username') setNewUsername('');
                if (type === 'email') { setNewEmail(''); setAuthPin(''); }
            } else {
                addToast(data.error || 'Update failed', 'error');
            }
        } catch (e) {
            addToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const startPinUpdate = async () => {
        setLoading(true);
        // We need the username or email to generate OTP. 
        // Assuming user is logged in, but generate/route expects username/email in body.
        // Ideally, generate/route should handle logged-in users via token too, OR we pass known username.
        // Limitation: We don't have username readily available in this component context easily without decoding token or AuthProvider.
        // WORKAROUND: Ask user to confirm Username for OTP? Or fetch from an endpoint.
        // Better: Update generate to allow asking for "me". 
        // For now, let's assume we need to prompt "Confirm Username" or we can blindly try fetching user profile first?
        // Let's rely on the user knowing their username. Or simply fetch '/api/auth/me' if we had it.
        // Let's try sending a dummy request or fix generate? 
        // Actually, we can assume the user knows their username.

        // Let's just create a quick "Enter Username to Send OTP" step if we don't have it.
        // OR: Update `generate` to inspect the cookie.

        // Let's implement visual flow:
        setPinFlowStep(1);
        setLoading(false);
    };

    // We actually need the username to send OTP. 
    // Let's add an input for it in the PIN flow for simplicity/security confirmation.
    const [confirmUser, setConfirmUser] = useState('');

    const sendOtp = async () => {
        if (!confirmUser) return addToast('Username required', 'error');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/otp/generate', {
                method: 'POST',
                body: JSON.stringify({ username: confirmUser }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                addToast('OTP Sent', 'success');
                setPinFlowStep(2); // Move to enter OTP
            } else {
                addToast('Failed to send OTP', 'error');
            }
        } catch (e) { addToast('Error sending OTP', 'error'); }
        setLoading(false);
    };

    const updatePin = async () => {
        if (!otp || !newPin) return addToast('Incomplete fields', 'error');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/profile/update', {
                method: 'POST',
                body: JSON.stringify({ type: 'pin', value: newPin, authorization: otp }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                addToast('PIN Updated Successfully', 'success');
                setPinFlowStep(0);
                setOtp(''); setNewPin(''); setConfirmUser('');
            } else {
                addToast(data.error || 'Failed', 'error');
            }
        } catch (e) { addToast('Network error', 'error'); }
        setLoading(false);
    };

    return (
        <Card className="glass-card p-6 space-y-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Profile Security</h2>
                    <p className="text-sm text-muted-foreground">Manage your account credentials</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Update Username */}
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <User className="h-4 w-4" /> <h3 className="font-medium text-sm">Update Username</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Limit: 3 changes per week.</p>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label htmlFor="newUsername" className="sr-only">New Username</label>
                            <Input
                                id="newUsername"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="New Username"
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <Button variant="primary" size="sm" onClick={() => handleUpdate('username', newUsername)} disabled={loading || !newUsername}>
                            <Edit3 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* 2. Update Email */}
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Mail className="h-4 w-4" /> <h3 className="font-medium text-sm">Update Email</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Requires current PIN.</p>
                    <div className="space-y-2">
                        <label htmlFor="newEmail" className="sr-only">New Email</label>
                        <Input
                            id="newEmail"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="New Email"
                            className="bg-black/20 border-white/10"
                        />
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label htmlFor="authPin" className="sr-only">Current PIN</label>
                                <Input
                                    id="authPin"
                                    type="password"
                                    value={authPin}
                                    onChange={(e) => setAuthPin(e.target.value)}
                                    placeholder="Current PIN"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <Button variant="primary" size="sm" onClick={() => handleUpdate('email', newEmail, authPin)} disabled={loading || !newEmail || !authPin}>
                                Update
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. Update PIN */}
                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 md:col-span-2">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Key className="h-4 w-4" /> <h3 className="font-medium text-sm">Change PIN</h3>
                    </div>

                    {pinFlowStep === 0 && (
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Requires OTP verification.</p>
                            <Button variant="secondary" size="sm" onClick={startPinUpdate}>Start Process</Button>
                        </div>
                    )}

                    {pinFlowStep === 1 && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                            <div className="flex-1">
                                <label htmlFor="confirmUser" className="sr-only">Confirm Username</label>
                                <Input
                                    id="confirmUser"
                                    value={confirmUser}
                                    onChange={(e) => setConfirmUser(e.target.value)}
                                    placeholder="Confirm Username for OTP"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <Button variant="primary" size="sm" onClick={sendOtp} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                            </Button>
                        </div>
                    )}

                    {pinFlowStep === 2 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                            <p className="text-xs text-green-400">OTP Sent! Enter code and new PIN.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="otpCode" className="sr-only">OTP Code</label>
                                    <Input
                                        id="otpCode"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="OTP Code"
                                        className="bg-black/20 border-white/10 text-center tracking-widest"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newPin" className="sr-only">New PIN</label>
                                    <Input
                                        id="newPin"
                                        type="password"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value)}
                                        placeholder="New PIN (6 digits)"
                                        maxLength={6}
                                        className="bg-black/20 border-white/10"
                                    />
                                </div>
                            </div>
                            <Button variant="primary" className="w-full" onClick={updatePin} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Update PIN"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

function AIPrivacySettings() {
    const [consentEnabled, setConsentEnabled] = useState(false);
    const [consentedAt, setConsentedAt] = useState<string | null>(null);
    const [termsVersion, setTermsVersion] = useState<string>('1.0');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const { addToast } = useToast();

    const fetchConsentStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/user/ai-consent');
            if (res.ok) {
                const data = await res.json();
                setConsentEnabled(data.aiConsent?.enabled ?? false);
                setConsentedAt(data.aiConsent?.consentedAt ?? null);
                setTermsVersion(data.aiConsent?.termsVersion ?? '1.0');
            }
        } catch (err) {
            console.error("Failed to load AI consent status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsentStatus();
    }, []);

    const handleToggle = async () => {
        if (!consentEnabled) {
            // Open modal to get consent
            setIsConsentModalOpen(true);
        } else {
            // Disable immediately
            try {
                setUpdating(true);
                const res = await fetch('/api/user/ai-consent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: false }),
                });
                if (res.ok) {
                    setConsentEnabled(false);
                    addToast("AI data processing disabled and cached insights cleared.", "info");
                } else {
                    throw new Error("Failed to update status");
                }
            } catch (err: any) {
                addToast(err.message || "Failed to update AI settings.", "error");
            } finally {
                setUpdating(false);
            }
        }
    };

    const handleConsentSuccess = () => {
        setConsentEnabled(true);
        setConsentedAt(new Date().toISOString());
        addToast("Prospera AI Analytical Advisor is now analyzing your patterns with zero-PII safeguards.", "success");
    };

    return (
        <>
            <Card className="glass-card p-6 space-y-6 md:col-span-2 border-purple-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-foreground">AI Intelligence & Privacy</h2>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                    consentEnabled 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                    {consentEnabled ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">Manage automated spending anomaly detection and Gemini AI access</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={handleToggle}
                            disabled={loading || updating}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 ${
                                consentEnabled ? 'bg-purple-600' : 'bg-zinc-700'
                            }`}
                            role="switch"
                            aria-checked={consentEnabled}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    consentEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-accent/40 border border-border/40 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Privacy Standard</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Strict Zero-PII sanitization. Names, emails, and credentials are never transmitted.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-accent/40 border border-border/40 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>Analytical Focus</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Flags category surges, impending cashflow pinches against bills, and subscription creep.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-accent/40 border border-border/40 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span>Consent Status</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {consentedAt 
                                ? `Granted on ${new Date(consentedAt).toLocaleDateString()} (v${termsVersion})`
                                : "Opt-in pending approval"}
                        </p>
                    </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border/40">
                    <button
                        type="button"
                        onClick={() => setIsPolicyModalOpen(true)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 underline-offset-2 hover:underline transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Full AI Privacy Policy & Terms of Service
                    </button>
                    
                    {consentEnabled && (
                        <p className="text-[11px] text-muted-foreground">
                            Toggling off will instantly delete cached insights and stop all AI queries.
                        </p>
                    )}
                </div>
            </Card>

            <AIConsentModal
                isOpen={isConsentModalOpen}
                onClose={() => setIsConsentModalOpen(false)}
                onConsentSuccess={handleConsentSuccess}
            />

            <AIPrivacyPolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
            />
        </>
    );
}

