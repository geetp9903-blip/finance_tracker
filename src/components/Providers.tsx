"use client";
import { AuthProvider } from "@/context/AuthContext";
import { FinanceProvider } from "@/context/FinanceContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <FinanceProvider>
                {children}
            </FinanceProvider>
        </AuthProvider>
    );
}
