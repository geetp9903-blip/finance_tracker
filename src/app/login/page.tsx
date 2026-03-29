"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { User, KeyRound, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

const initialState = {
    message: '',
};

export default function LoginPage() {
    const [view, setView] = useState<'login' | 'register'>('login');

    // Server Action Hooks
    const [loginState, loginDispatch, isLoginPending] = useActionState(loginAction, initialState);
    const [registerState, registerDispatch, isRegisterPending] = useActionState(registerAction, initialState);

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`
            }
        });
        if (error) {
            console.error("Google login error:", error.message);
        }
    };

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
                                
                                <div className="mt-6 flex items-center justify-center space-x-2">
                                    <span className="h-px w-full bg-gray-200"></span>
                                    <span className="text-xs font-medium text-gray-500 uppercase">Or</span>
                                    <span className="h-px w-full bg-gray-200"></span>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 mt-4 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center justify-center space-x-2"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    <span>Continue with Google</span>
                                </Button>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
}
