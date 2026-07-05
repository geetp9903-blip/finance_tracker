"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { User, KeyRound, CheckCircle } from "lucide-react";

export default function SetupUsernamePage() {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/setup-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to setup username');
                setIsLoading(false);
                return;
            }

            // Success, redirect to dashboard
            router.push('/dashboard');
            router.refresh();

        } catch (err) {
            setError('An error occurred during setup');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
            <Card className="w-full max-w-md border-white/10 shadow-2xl overflow-hidden glass-card p-6 pt-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Complete Profile</h1>
                        <p className="text-muted-foreground text-sm">
                            Choose a unique username and a PIN to secure your account.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                    className="pl-10 h-12"
                                    placeholder="johndoe123"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                                Create PIN
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="pin"
                                    name="pin"
                                    type="password"
                                    required
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="pl-10 h-12 tracking-widest"
                                    placeholder="4-6 digits"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                                Confirm PIN
                            </label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="confirmPin"
                                    name="confirmPin"
                                    type="password"
                                    required
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="pl-10 h-12 tracking-widest"
                                    placeholder="Repeat PIN"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 mt-4"
                        >
                            {isLoading ? 'Setting up...' : 'Complete Profile'}
                        </Button>
                    </form>
                </motion.div>
            </Card>
        </div>
    );
}
