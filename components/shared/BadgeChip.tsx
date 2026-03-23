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
                "group relative inline-flex items-center rounded-full font-bold transition-all",
                sizeClasses[size],
                isPlan
                    ? "border-2"
                    : "shadow-sm",
                onClick && "cursor-pointer hover:scale-105 active:scale-95",
                className
            )}
            style={{
                backgroundColor: isPlan ? "transparent" : badge.color,
                color: isPlan ? badge.color : badge.text_color,
                borderColor: isPlan ? badge.color : "transparent",
                opacity: (isActive || !onClick) ? 1 : 0.7,
            }}
            onClick={onClick}
            title={showTooltip ? (badge.description || badge.name) : undefined}
            role={onClick ? "button" : "status"}
            aria-label={badge.description || badge.name}
        >
            {/* Icon (Lucide or Emoji) */}
            <span className={cn("flex shrink-0 items-center justify-center", iconSizes[size])}>
                {Icon ? <Icon strokeWidth={2.5} /> : <span className="leading-none">{badge.icon}</span>}
            </span>

            {/* Name */}
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
