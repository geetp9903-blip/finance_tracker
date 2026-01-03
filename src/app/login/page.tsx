"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { User, KeyRound, Mail } from "lucide-react";

const initialState = {
    message: '',
};

export default function LoginPage() {
    const [view, setView] = useState<'login' | 'register'>('login');

    // Server Action Hooks
    const [loginState, loginDispatch, isLoginPending] = useActionState(loginAction, initialState);
    const [registerState, registerDispatch, isRegisterPending] = useActionState(registerAction, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
            <Card className="w-full max-w-md border-white/10 shadow-2xl overflow-hidden glass-card">
                {/* Header Tabs */}
                <div className="flex w-full bg-black/20 p-1">
                    <button
                        onClick={() => setView('login')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${view === 'login'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setView('register')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${view === 'register'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                    >
                        Register
                    </button>
                </div>

                <div className="p-6 pt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold tracking-tight mb-2">
                                    {view === 'login' ? "Welcome Back" : "Create Account"}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {view === 'login'
                                        ? "Enter your credentials to access your dashboard"
                                        : "Start your financial journey today"}
                                </p>
                            </div>

                            <form action={view === 'login' ? loginDispatch : registerDispatch} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            name="username"
                                            placeholder="Enter username"
                                            className="pl-10 h-12" // h-12 for better touch/click area
                                            required
                                        />
                                    </div>
                                    {view === 'register' && registerState?.errors?.username && (
                                        <p className="text-xs text-destructive ml-1">{registerState.errors.username[0]}</p>
                                    )}
                                </div>

                                {view === 'register' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email (Optional)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                name="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-10 h-12"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">PIN</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            name="pin"
                                            type="password"
                                            placeholder="••••••"
                                            maxLength={6}
                                            className="pl-10 h-12 tracking-widest"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <Link href="/forgot-pin" className="text-xs text-primary hover:underline">
                                            Forgot PIN?
                                        </Link>
                                    </div>
                                    {view === 'register' && registerState?.errors?.pin && (
                                        <p className="text-xs text-destructive ml-1">{registerState.errors.pin[0]}</p>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {view === 'login' && loginState?.message && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
                                        {loginState.message}
                                    </div>
                                )}
                                {view === 'register' && registerState?.message && (
                                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
                                        {registerState.message}
                                    </div>
                                )}

                                <Button
                                    className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 mt-4"
                                    disabled={isLoginPending || isRegisterPending}
                                >
                                    {isLoginPending || isRegisterPending
                                        ? "Processing..."
                                        : view === 'login' ? "Access Dashboard" : "Create Account"
                                    }
                                </Button>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
}
