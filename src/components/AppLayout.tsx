"use client";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import { useState } from "react";
import { Menu } from "lucide-react";

export function AppLayout({ children, username }: { children: React.ReactNode, username?: string }) {
    const { user: authUser, loading: authLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const shouldShowLayout = !isAuthPage;

    // Use server-provided username if available, else client auth
    const displayUser = username || authUser?.username;

    return (
        <div className="flex min-h-screen relative">

            {/* Mobile Header */}
            {shouldShowLayout && (
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

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                username={displayUser}
            />

            <main className={cn(
                "flex-1 p-4 md:p-8 transition-all duration-300",
                shouldShowLayout ? "pt-20 md:pt-8 md:ml-64" : ""
            )}>
                {shouldShowLayout ? (
                    <div className="bg-card/50 rounded-[20px] overflow-hidden min-h-[calc(100vh-4rem)] p-6 border border-white/5 shadow-2xl">
                        {children}
                    </div>
                ) : children}
            </main>
        </div>
    );
}
