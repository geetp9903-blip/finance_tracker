"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const [view, setView] = useState<'login' | 'register' | 'forgot-pin'>('login');
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const { login, register } = useAuth();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [otpCooldown, setOtpCooldown] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (view === 'register') {
            const success = await register(username, pin, email);
            if (success) {
                setView('login');
                setMessage("Registration successful! Please login.");
            } else {
                setError("Registration failed. User might exist.");
            }
        } else if (view === 'login') {
            const success = await login(username, pin);
            if (!success) {
                setError("Invalid credentials.");
            }
        } else if (view === 'forgot-pin') {
            if (!otp) {
                // Step 1: Request OTP
                if (otpCooldown > 0) return;

                try {
                    const res = await fetch('/api/auth/otp/generate', {
                        method: 'POST',
                        body: JSON.stringify({ username, email }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (res.ok) {
                        setMessage("OTP sent to your email.");
                        setOtpCooldown(60);
                        const interval = setInterval(() => {
                            setOtpCooldown((prev) => {
                                if (prev <= 1) {
                                    clearInterval(interval);
                                    return 0;
                                }
                                return prev - 1;
                            });
                        }, 1000);
                    } else {
                        // Handle generic error vs "Too Many Requests"
                        if (res.status === 429) {
                            setError("Please wait before requesting another OTP.");
                        } else {
                            setError("Failed to send OTP. Check username/email.");
                        }
                    }
                } catch (err) {
                    setError("Error sending OTP.");
                }
            } else {
                // Step 2: Verify & Reset/Login
                try {
                    const res = await fetch('/api/auth/otp/verify', {
                        method: 'POST',
                        body: JSON.stringify({ username, code: otp, newPin: pin }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (res.ok) {
                        setMessage("PIN Reset Successful. Logging in...");

                        // Force a hard navigation to ensure cookies are picked up
                        setTimeout(() => {
                            window.location.href = "/";
                        }, 1000);
                    } else {
                        setError("Invalid OTP.");
                    }
                } catch (err) {
                    setError("Error verifying OTP.");
                }
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
            <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
                <div className="flex w-full mb-6 bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => { setView('login'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'login' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setView('register'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'register' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Register
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h1 className="mb-2 text-2xl font-bold text-foreground text-center">
                            {view === 'register' ? "Create Account" : view === 'login' ? "Welcome Back" : "Reset PIN"}
                        </h1>
                        <p className="mb-6 text-muted-foreground text-center text-sm">
                            {view === 'register' ? "Setup your usernames, PIN & optional email" : view === 'login' ? "Enter your credentials to access" : "Enter username/email to receive OTP"}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {view !== 'forgot-pin' && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-foreground/80">Username</label>
                                    <Input
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10 focus:border-primary/50"
                                    />
                                </div>
                            )}

                            {view === 'register' && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-foreground/80">Email (Optional for OTP)</label>
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white/5 border-white/10 focus:border-primary/50"
                                    />
                                </div>
                            )}

                            {(view === 'login' || view === 'register') && (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-medium text-foreground/80">PIN</label>
                                        {view === 'login' && (
                                            <button type="button" onClick={() => setView('forgot-pin')} className="text-xs text-primary hover:underline">
                                                Forgot PIN?
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder={view === 'register' ? "Create 4-6 digit PIN" : "Enter PIN"}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="bg-white/5 border-white/10 focus:border-primary/50"
                                    />
                                </div>
                            )}

                            {view === 'forgot-pin' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-foreground/80">Username</label>
                                        <Input
                                            type="text"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            className="bg-white/5 border-white/10 focus:border-primary/50"
                                        />
                                    </div>
                                    {message && (
                                        <>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-foreground/80">OTP Code</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter 6-digit code"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    required
                                                    className="bg-white/5 border-white/10 focus:border-primary/50 text-center tracking-widest font-mono text-lg"
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <label className="mb-1.5 block text-xs font-medium text-foreground/80">New PIN</label>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter new 4-6 digit PIN"
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value)}
                                                    required
                                                    maxLength={6}
                                                    className="bg-white/5 border-white/10 focus:border-primary/50"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {error && <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-md">{error}</p>}
                            {message && <p className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded-md">{message}</p>}

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full font-semibold shadow-lg shadow-primary/20"
                                    variant="primary"
                                    disabled={view === 'forgot-pin' && !otp && otpCooldown > 0}
                                >
                                    {view === 'register' ? "Create Account"
                                        : view === 'login' ? "Access Dashboard"
                                            : message ? "Reset PIN & Login"
                                                : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Send OTP"}
                                </Button>
                            </div>

                            {view === 'forgot-pin' && (
                                <button type="button" onClick={() => setView('login')} className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2">
                                    Back to Login
                                </button>
                            )}
                        </form>
                    </motion.div>
                </AnimatePresence>
            </Card>
        </div>
    );
}
