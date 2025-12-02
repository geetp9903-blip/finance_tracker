"use client";

import { useTheme } from "@/context/ThemeContext";

export function BackgroundController() {
    const { bgStyle } = useTheme();

    if (bgStyle !== "liquid") return null;

    return <div className="liquid-bg" />;
}
