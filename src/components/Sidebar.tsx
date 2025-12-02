"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PiggyBank, LogOut, RefreshCw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Budget", href: "/budget", icon: PiggyBank },
    { name: "Recurring", href: "/recurring", icon: RefreshCw },
    { name: "Calendar", href: "/calendar", icon: Calendar },
];

import { X } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/10 bg-[#0a0a0a] transition-transform duration-300 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col px-3 py-4">
                    <div className="mb-10 flex items-center justify-between pl-2.5 mt-4">
                        <div className="flex items-center">
                            <div className="h-10 w-10 relative mr-3">
                                <img src="/Prospera_1_icon.png" alt="Prospera Logo" className="object-contain w-full h-full" />
                            </div>
                            <span className="self-center whitespace-nowrap text-xl font-semibold text-white">
                                Prospera
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/60 hover:text-white md:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <ul className="space-y-2 font-medium">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => onClose()} // Close sidebar on navigation (mobile)
                                        className={cn(
                                            "flex items-center rounded-xl p-3 text-white transition-all hover:bg-white/10 group",
                                            isActive && "bg-white/10 shadow-lg shadow-primary/5 ring-1 ring-white/20"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-white/70 group-hover:text-white")} />
                                        <span className="ml-3">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-auto mb-4">
                        <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-xs text-white/50">Logged in as</p>
                            <p className="text-sm font-medium text-white">{user.username}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex w-full items-center rounded-xl p-3 text-white transition-colors hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/20 cursor-pointer"
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
