"use client";
import { AuthProvider } from "@/context/AuthContext";

import { ThemeProvider } from "@/context/ThemeContext";
import { BackgroundController } from "@/components/BackgroundController";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <BackgroundController />
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThemeProvider>
    );
}
