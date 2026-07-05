"use client";
import { AuthProvider } from "@/context/AuthContext";

import { ThemeProvider } from "@/context/ThemeContext";
import { BackgroundController } from "@/components/BackgroundController";

import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <BackgroundController />
            <ToastProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
