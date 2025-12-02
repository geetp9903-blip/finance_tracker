"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "dark";
type BgStyle = "static" | "liquid";
type GlassStyle = "frost" | "liquid";

interface ThemeContextType {
    mode: ThemeMode;
    bgStyle: BgStyle;
    glassStyle: GlassStyle;
    setBgStyle: (style: BgStyle) => void;
    setGlassStyle: (style: GlassStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode] = useState<ThemeMode>("dark");
    const [bgStyle, setBgStyle] = useState<BgStyle>("liquid");
    const [glassStyle, setGlassStyle] = useState<GlassStyle>("liquid");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedBg = localStorage.getItem("theme_bg") as BgStyle;
        const savedGlass = localStorage.getItem("theme_glass") as GlassStyle;

        if (savedBg) setBgStyle(savedBg);
        if (savedGlass) setGlassStyle(savedGlass);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("theme_mode", "dark");
        localStorage.setItem("theme_bg", bgStyle);
        localStorage.setItem("theme_glass", glassStyle);

        // Apply class to body for global styling if needed
        document.body.classList.remove("light");
        document.body.classList.add("dark");
        document.body.setAttribute("data-glass", glassStyle);
        document.body.setAttribute("data-bg", bgStyle);
    }, [bgStyle, glassStyle, mounted]);

    if (!mounted) {
        return null; // Prevent hydration mismatch
    }

    return (
        <ThemeContext.Provider
            value={{
                mode,
                bgStyle,
                glassStyle,
                setBgStyle,
                setGlassStyle,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
