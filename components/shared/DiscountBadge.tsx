"use client";

import { cn } from "@/lib/utils";

interface DiscountBadgeProps {
    text: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export default function DiscountBadge({ text, className, size = "md" }: DiscountBadgeProps) {
    return (
        <div className={cn(
            "bg-[#FF7043] text-white font-black uppercase tracking-tighter leading-none rounded-lg shadow-lg rotate-2 select-none",
            size === "sm" ? "px-2 py-1 text-[10px]" :
                size === "md" ? "px-3 py-1.5 text-xs" :
                    "px-4 py-2 text-sm",
            className
        )}>
            {text}
        </div>
    );
}
