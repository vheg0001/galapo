"use client";

import { Badge } from "@/lib/types";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeLivePreviewProps {
    name: string;
    icon: string;
    icon_lucide?: string | null;
    color: string;
    text_color: string;
}

export default function BadgeLivePreview({
    name,
    icon,
    icon_lucide,
    color,
    text_color,
}: BadgeLivePreviewProps) {
    const renderIcon = () => {
        if (icon_lucide) {
            const Icon = (LucideIcons as any)[icon_lucide];
            if (Icon) return <Icon className="h-4 w-4" />;
        }
        return <span className="text-lg leading-none">{icon || "✨"}</span>;
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <span className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Visual Preview</span>

            <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300"
                style={{ backgroundColor: color || "#DC2626", color: text_color || "#FFFFFF" }}
            >
                {renderIcon()}
                <span>{name || "Badge Preview"}</span>
            </div>

            <p className="mt-6 text-[11px] text-center text-muted-foreground leading-relaxed max-w-[200px]">
                This is how the badge will appear on listing cards and detail pages.
            </p>
        </div>
    );
}
