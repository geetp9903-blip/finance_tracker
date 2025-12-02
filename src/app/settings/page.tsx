"use client";

import { useTheme } from "@/context/ThemeContext";
import { Card } from "@/components/ui/Card";
import { Moon, Sun, Droplets, Layers, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { bgStyle, setBgStyle, glassStyle, setGlassStyle } = useTheme();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Background Style */}
                <Card className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Background</h2>
                            <p className="text-sm text-muted-foreground">Toggle animated liquid background</p>
                        </div>
                    </div>

                    <div className="flex bg-accent/50 p-1 rounded-xl">
                        <button
                            onClick={() => setBgStyle('static')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                bgStyle === 'static' ? "bg-accent text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="h-4 w-4" /> Static
                        </button>
                        <button
                            onClick={() => setBgStyle('liquid')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                bgStyle === 'liquid' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Droplets className="h-4 w-4" /> Liquid
                        </button>
                    </div>
                </Card>

                {/* Glass Effect */}
                <Card className="glass-card p-6 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Glass Effect</h2>
                            <p className="text-sm text-muted-foreground">Customize the glassmorphism style</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setGlassStyle('frost')}
                            className={cn(
                                "relative overflow-hidden p-4 rounded-xl border transition-all duration-300 text-left group",
                                glassStyle === 'frost' ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                            )}
                        >
                            <div className="absolute inset-0 bg-accent/50 backdrop-blur-xl" />
                            <div className="relative z-10">
                                <h3 className="font-medium text-foreground mb-1">Classic Frost</h3>
                                <p className="text-xs text-muted-foreground">Matte finish, high blur, standard border. The classic iOS look.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setGlassStyle('liquid')}
                            className={cn(
                                "relative overflow-hidden p-4 rounded-xl border transition-all duration-300 text-left group",
                                glassStyle === 'liquid' ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                            )}
                        >
                            {/* Preview of Liquid Style inside the button */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md" />
                            <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />

                            <div className="relative z-10">
                                <h3 className="font-medium text-foreground mb-1">Liquid Gloss</h3>
                                <p className="text-xs text-muted-foreground">Refractive edges, wet look, prismatic shadows. Premium feel.</p>
                            </div>
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
