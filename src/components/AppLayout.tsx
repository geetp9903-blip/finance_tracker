"use client";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className={cn("flex-1 p-8 transition-all duration-300", user ? "ml-64" : "")}>
                {children}
            </main>
        </div>
    );
}
