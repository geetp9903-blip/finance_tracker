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

            {/* Mobile Header */}
            {user && (
                <div className="fixed top-0 left-0 right-0 z-30 flex items-center p-4 bg-background/80 backdrop-blur-xl border-b border-border md:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-3 text-lg font-semibold text-foreground">Prospera</span>
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
