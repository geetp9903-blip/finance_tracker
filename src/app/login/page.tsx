"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const { login, register } = useAuth();
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (isRegistering) {
            const success = await register(username, pin);
            if (success) {
                setIsRegistering(false);
                alert("Registration successful! Please login.");
            } else {
                setError("Registration failed. User might exist.");
            }
        } else {
            const success = await login(username, pin);
            if (!success) {
                setError("Invalid credentials.");
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md glass-card">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="mb-2 text-3xl font-bold text-white text-center">
                        {isRegistering ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p className="mb-8 text-white/60 text-center">
                        {isRegistering ? "Set up your finance tracker" : "Enter your credentials to access"}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white">Username</label>
                            <Input
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white">PIN</label>
                            <Input
                                type="password"
                                placeholder="Enter 4-6 digit PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                required
                                maxLength={6}
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <Button type="submit" className="w-full" variant="primary">
                            {isRegistering ? "Register" : "Login"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer"
                        >
                            {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
                        </button>
                    </div>
                </motion.div>
            </Card>
        </div>
    );
}
