"use client";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BackgroundController } from "@/components/BackgroundController";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <BackgroundController />
            <AuthProvider>
                <FinanceProvider>
                    {children}
                </FinanceProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
