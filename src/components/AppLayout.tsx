"use client";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

import { useState } from "react";
import { Menu } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen relative">
            {/* Background Animation */}
            <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40">
                <iframe
                    src="https://lottie.host/embed/d7c50331-c5fd-4d5f-9340-9f6b54adb168/k7LoP9fWro.lottie"
                    className="w-full h-full border-none"
                    loading="lazy"
                    title="Background Animation"
                />
            </div>
            {/* Mobile Header */}
            {user && (
                <div className="fixed top-0 left-0 right-0 z-30 flex items-center p-4 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 md:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-white/60 hover:text-white"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-3 text-lg font-semibold text-white">Prospera</span>
                </div>
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className={cn(
                "flex-1 p-4 md:p-8 transition-all duration-300",
                user ? "pt-20 md:pt-8 md:ml-64" : ""
            )}>
                {children}
            </main>
        </div>
    );
}
