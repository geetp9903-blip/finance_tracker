"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PiggyBank, LogOut, RefreshCw, Calendar, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Budget", href: "/budget", icon: PiggyBank },
    { name: "Recurring", href: "/recurring", icon: RefreshCw },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

import { X } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout, loading } = useAuth();

    // Always show sidebar unless we are on the login page
    // This prevents the sidebar from disappearing on reload while auth is checking
    const isLoginPage = pathname === '/login';

    if (isLoginPage) return null;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col px-3 py-4 overflow-y-auto pb-20 md:pb-4">
                    <div className="mb-10 flex items-center justify-between pl-2.5 mt-4 shrink-0">
                        <div className="flex items-center">
                            <div className="h-10 w-10 relative mr-3">
                                <img src="/Prospera_1_icon.png" alt="Prospera Logo" className="object-contain w-full h-full" />
                            </div>
                            <span className="self-center whitespace-nowrap text-xl font-semibold text-foreground">
                                Prospera
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground md:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <ul className="space-y-2 font-medium flex-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => onClose()} // Close sidebar on navigation (mobile)
                                        className={cn(
                                            "flex items-center rounded-xl p-3 text-foreground transition-all duration-200 ease-in-out hover:bg-accent hover:scale-105 active:scale-95 group",
                                            isActive && "bg-accent shadow-lg shadow-primary/5 ring-1 ring-border"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5 transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        <span className="ml-3">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-auto mb-4 shrink-0">
                        <div className="mb-4 px-3 py-2 rounded-xl bg-accent/50 border border-border">
                            <p className="text-xs text-muted-foreground">Logged in as</p>
                            <p className="text-sm font-medium text-foreground">{user?.username || 'Loading...'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex w-full items-center rounded-xl p-3 text-foreground transition-all duration-200 ease-in-out hover:bg-destructive/10 hover:text-destructive hover:scale-105 active:scale-95 border border-transparent hover:border-destructive/20 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="ml-3">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
