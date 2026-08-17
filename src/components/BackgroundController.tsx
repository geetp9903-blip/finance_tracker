"use client";

import { useTheme } from "@/context/ThemeContext";

export function BackgroundController() {
    const { bgStyle } = useTheme();

    // Even if bgStyle is 'liquid', we now render the optimized "Safe Zone" version.
    // We can rename the option in the UI later, but for now, let's just override the implementation.
    if (bgStyle !== "liquid" && bgStyle !== "static") return null;

    return (
        <div className="static-blob-bg pointer-events-none">
            {/* Safe Zone: Red Glow at Top (Caution/High) */}
            <div 
                className="blob"
                style={{
                    top: '-20%',
                    left: '20%',
                    width: '60vw',
                    height: '60vw',
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
                    transform: 'translate3d(0, 0, 0)',
                    filter: 'blur(100px)',
                }}
            />

            {/* Safe Zone: Green Glow at Bottom (Growth/Stability) */}
            <div 
                className="blob"
                style={{
                    bottom: '-20%',
                    right: '10%',
                    width: '70vw',
                    height: '70vw',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
                    transform: 'translate3d(0, 0, 0)',
                    filter: 'blur(120px)',
                }}
            />
            
            {/* Optional: Subtle Indigo Center/Side for "Trust" */}
            <div 
                className="blob"
                style={{
                    top: '40%',
                    left: '-10%',
                    width: '50vw',
                    height: '50vw',
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 70%)',
                    transform: 'translate3d(0, 0, 0)',
                    filter: 'blur(90px)',
                }}
            />
        </div>
    );
}
