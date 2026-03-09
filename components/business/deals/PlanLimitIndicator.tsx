"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Zap } from "lucide-react";

interface PlanLimitIndicatorProps {
    used: number;
    total: number;
    title?: string;
    subtitle?: string;
    className?: string;
}

export default function PlanLimitIndicator({ used, total, title = "Deal Slot Usage", subtitle, className }: PlanLimitIndicatorProps) {
    const safeTotal = total > 0 ? total : 0;
    const percentage = safeTotal > 0 ? Math.min(100, (used / safeTotal) * 100) : 0;
    const isAtLimit = safeTotal > 0 && used >= safeTotal;

    return (
        <div className={cn("rounded-2xl border border-border/50 bg-card p-6 shadow-sm", className)}>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">{title}</h3>
                    {subtitle && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{subtitle}</p>
                    )}
                    <p className="text-2xl font-black tracking-tight text-foreground">
                        {used} <span className="text-muted-foreground/30">/</span> {safeTotal}
                    </p>
                </div>
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner",
                    isAtLimit ? "bg-red-50 text-red-600" : "bg-primary/5 text-primary"
                )}>
                    <Zap className={cn("h-6 w-6", isAtLimit ? "" : "fill-current")} />
                </div>
            </div>

            <Progress value={percentage} className="h-2" />

            <div className="mt-4 flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {safeTotal === 0 ? "No deal slots available" : isAtLimit ? "Limit reached" : `${safeTotal - used} slots remaining`}
                </p>
                {isAtLimit && (
                    <Link
                        href="/business/subscription"
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4"
                    >
                        Upgrade Plan
                    </Link>
                )}
            </div>
        </div>
    );
}
