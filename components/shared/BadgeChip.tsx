"use client";

import { Badge as BadgeType } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import React from "react";

interface BadgeChipProps {
    badge: BadgeType;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
    showTooltip?: boolean;
    className?: string;
    isActive?: boolean;
}

export default function BadgeChip({
    badge,
    size = "md",
    onClick,
    showTooltip = true,
    className,
    isActive = false,
}: BadgeChipProps) {
    // Dynamically get the Lucide icon if icon_lucide is provided
    const Icon = badge.icon_lucide
        ? (LucideIcons as any)[
        badge.icon_lucide
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("")
        ] || (LucideIcons as any)[badge.icon_lucide] // Try camelCase and literal
        : null;

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-[10px] gap-1",
        md: "px-2.5 py-1 text-xs gap-1.5",
        lg: "px-3 py-1.5 text-sm gap-2",
    };

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-3.5 w-3.5",
        lg: "h-4 w-4",
    };

    const isPlan = badge.type === "plan";

    return (
        <div
            className={cn(
                "group relative inline-flex items-center rounded-full font-bold transition-all duration-300",
                sizeClasses[size],
                isPlan ? "shadow-sm uppercase tracking-wider" : "shadow-sm",
                badge.slug === "premium" && "bg-gradient-to-br from-[#FFD700] via-[#FFF4B0] to-[#B8860B] text-black border border-amber-400/30",
                badge.animation_type && badge.animation_type !== "none" && `flair-anim-${badge.animation_type}`,
                onClick && "cursor-pointer hover:scale-105 active:scale-95",
                className
            )}
            style={{
                backgroundColor: badge.slug === "premium" ? undefined : (isPlan ? badge.color : badge.color),
                color: badge.slug === "premium" ? undefined : (isPlan ? badge.text_color : badge.text_color),
                borderColor: badge.slug === "premium" ? undefined : "transparent",
                opacity: (isActive || !onClick) ? 1 : 0.7,
                ["--flair-color" as any]: badge.animation_color || undefined,
            }}
            onClick={onClick}
            title={showTooltip ? (badge.description || badge.name) : undefined}
            role={onClick ? "button" : "status"}
            aria-label={badge.description || badge.name}
        >
            {/* Icon (Lucide or Emoji) - Hidden for Plan Badges */}
            {!isPlan && (
                <span className={cn("flex shrink-0 items-center justify-center", iconSizes[size])}>
                    {Icon ? <Icon strokeWidth={2.5} /> : <span className="leading-none">{badge.icon}</span>}
                </span>
            )}

            {/* Name */}
            {/* Name */}
            {badge.animation_type === "twinkle" && (
                <>
                    <span className="flair-twinkle-star" style={{ top: "-4px", left: "10%", animationDelay: "0s" }}>★</span>
                    <span className="flair-twinkle-star" style={{ top: "40%", right: "-2px", animationDelay: "1s" }}>★</span>
                    <span className="flair-twinkle-star" style={{ bottom: "-4px", left: "30%", animationDelay: "2s" }}>★</span>
                </>
            )}
            <span className="truncate">{badge.name}</span>

            {/* Description Tooltip (Simplified native title is used, but we can add a custom one if needed) */}
            {showTooltip && badge.description && (
                <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 z-50 w-48 text-center pointer-events-none">
                    {badge.description}
                    <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
}
