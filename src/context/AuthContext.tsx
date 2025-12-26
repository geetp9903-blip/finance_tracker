"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, pin: string) => Promise<boolean>;
    register: (username: string, pin: string, email?: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Verify session with server instead of localStorage
        const checkSession = async () => {
            try {
                // We'll use the profile endpoint or similar to check if we are logged in
                const res = await fetch('/api/auth/profile');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else if (res.status === 401) {
                    // Session invalid or expired - force redirect
                    router.push('/login');
                }
            } catch (error) {
                // Not logged in or network error
                console.log('Session check failed', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const register = async (username: string, pin: string, email?: string) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin, email }),
            });
            const data = await res.json();
            return data.success;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const login = async (username: string, pin: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin }),
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                // No localStorage caching
                router.push('/');
                return true;
            }
            return false;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
