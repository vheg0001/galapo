"use client";

import React, { useState } from "react";
import { Badge } from "@/lib/types";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeLivePreviewProps {
    name: string;
    icon: string;
    icon_lucide?: string | null;
    color: string;
    text_color: string;
    type?: string;
    slug?: string;
    animationType?: string;
    animationColor?: string | null;
}

export default function BadgeLivePreview({
    name,
    icon,
    icon_lucide,
    color,
    text_color,
    type,
    slug,
    animationType = "none",
    animationColor = null,
}: BadgeLivePreviewProps) {
    const [currentBg, setCurrentBg] = useState<'light' | 'dark' | 'glass'>('light');

    const renderIcon = () => {
        if (icon_lucide) {
            const Icon = (LucideIcons as any)[icon_lucide];
            if (Icon) return <Icon className="h-4 w-4" />;
        }
        return <span className="text-lg leading-none">{icon || "✨"}</span>;
    };

    const getBgClass = () => {
        switch (currentBg) {
            case 'dark': return 'bg-slate-900 border-slate-800';
            case 'glass': return 'bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-slate-950 border-slate-700';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 rounded-2xl border transition-all duration-500 relative overflow-hidden",
            getBgClass(),
            "animate-in fade-in zoom-in-95 duration-200"
        )}>
            {/* Background mesh for glass mode */}
            {currentBg === 'glass' && (
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700" />
                </div>
            )}

            <span className={cn(
                "mb-6 text-[10px] font-bold uppercase tracking-widest relative z-10 transition-colors duration-300",
                currentBg === 'light' ? "text-muted-foreground/40" : "text-white/20"
            )}>Visual Preview</span>

            <div
                className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 relative z-10",
                    type === "plan" && "uppercase tracking-wider",
                    slug === "premium" && "bg-gradient-to-br from-[#FFD700] via-[#FFF4B0] to-[#B8860B] text-black border border-amber-400/30 shadow-md scale-105",
                    animationType && animationType !== "none" && `flair-anim-${animationType}`
                )}
                style={{
                    backgroundColor: slug === "premium" ? undefined : color,
                    color: slug === "premium" ? undefined : text_color,
                    borderColor: slug === "premium" ? undefined : "transparent",
                    "--flair-color": animationColor || undefined,
                } as any}
            >
                {type !== "plan" && renderIcon()}
                {animationType === "twinkle" && (
                    <>
                        <span className="flair-twinkle-star" style={{ top: "-4px", left: "10%", animationDelay: "0s" }}>★</span>
                        <span className="flair-twinkle-star" style={{ top: "40%", right: "-2px", animationDelay: "1s" }}>★</span>
                        <span className="flair-twinkle-star" style={{ bottom: "-4px", left: "30%", animationDelay: "2s" }}>★</span>
                    </>
                )}
                <span>{name || "Flair Preview"}</span>
            </div>

            <div className="mt-8 flex gap-2 relative z-10 p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                {(['light', 'dark', 'glass'] as const).map((bg) => (
                    <button
                        key={bg}
                        onClick={() => setCurrentBg(bg)}
                        className={cn(
                            "w-6 h-6 rounded-full border border-white/10 transition-all duration-200",
                            bg === 'light' && "bg-white",
                            bg === 'dark' && "bg-slate-900",
                            bg === 'glass' && "bg-gradient-to-br from-indigo-500 to-purple-600",
                            currentBg === bg ? "ring-2 ring-primary ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        title={`${bg.charAt(0).toUpperCase() + bg.slice(1)} Mode`}
                    />
                ))}
            </div>

            <p className={cn(
                "mt-6 text-[10px] text-center leading-relaxed max-w-[220px] relative z-10 transition-colors duration-300",
                currentBg === 'light' ? "text-muted-foreground" : "text-white/40"
            )}>
                Test visibility across different themes. Light effects pop best on darker backgrounds.
            </p>
        </div>
    );
}
