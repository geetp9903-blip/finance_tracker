"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, LogOut, RefreshCw, Calendar, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Recurring", href: "/recurring", icon: RefreshCw },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

import { X } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    username?: string;
}

export function Sidebar({ isOpen, onClose, username }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    // Always show sidebar unless we are on the login page
    // This prevents the sidebar from disappearing on reload while auth is checking
    const isLoginPage = pathname === '/login';

    if (isLoginPage) return null;

    return (
        <>
            {/* Mobile Sidebar (Drawer) */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />

                    {/* Drawer Content */}
                    <aside className="relative flex w-[85vw] max-w-sm flex-col bg-card h-full overflow-y-auto border-r border-border shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <img src="/Prospera_1_icon.png" alt="Logo" className="h-8 w-8 object-contain" />
                                <span className="font-semibold text-lg">Prospera</span>
                            </div>
                            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 px-3 py-4">
                            <ul className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                onClick={onClose}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="p-4 border-t border-border/50 bg-muted/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                    {username ? username[0].toUpperCase() : 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{username || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">Pro Member</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-destructive font-medium hover:bg-destructive/20 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar (Fixed, md:flex) */}
            <aside className="hidden md:flex fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r border-border bg-card/95 backdrop-blur-xl">
                <div className="flex h-full flex-col px-3 py-4">
                    <div className="mb-8 flex items-center pl-3 mt-2">
                        <div className="h-8 w-8 relative mr-3">
                            <img src="/Prospera_1_icon.png" alt="Logo" className="object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Prospera</span>
                    </div>

                    <ul className="space-y-1 flex-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-auto pt-4 border-t border-border/50">
                        <div className="mb-4 px-3 py-2 rounded-lg bg-accent/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
                            <p className="text-sm font-medium truncate">{username || 'Loading...'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
