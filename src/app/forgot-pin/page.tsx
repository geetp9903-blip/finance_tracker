"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Loader2, ArrowLeft } from "lucide-react";
import { requestPinReset, resetPin } from "@/lib/actions/auth";

export default function ForgotPinPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState<1 | 2>(1);

    // Step 1 State
    const [username, setUsername] = useState("");

    // Step 2 State
    const [otp, setOtp] = useState("");
    const [newPin, setNewPin] = useState("");

    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    const handleRequest = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        startTransition(async () => {
            const result = await requestPinReset(username);
            if (result.success) {
                setMsg(result.message);
                setStep(2);
            } else {
                setError(result.message);
            }
        });
    };

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        startTransition(async () => {
            const result = await resetPin(username, otp, newPin);
            if (result.success) {
                router.push("/login?restored=true");
            } else {
                setError(result.message);
            }
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md glass-card">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Reset PIN</CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Enter your username to receive a verification code."
                            : "Sent! Check your SERVER CONSOLE for the code."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <form onSubmit={handleRequest} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Code
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="p-3 bg-secondary/50 rounded-md text-xs text-muted-foreground my-2">
                                {msg}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Verification Code</label>
                                <Input
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000000"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">New PIN</label>
                                <Input
                                    type="password"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                    placeholder="4-6 digit numeric PIN"
                                    required
                                    maxLength={6}
                                />
                            </div>

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                                    Back
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reset PIN
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm">
                        <Link href="/login" className="flex items-center justify-center text-muted-foreground hover:text-primary">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
