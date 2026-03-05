import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    trend?: { value: number; label?: string };
    href?: string;
    urgent?: boolean;
}

export default function AdminStatsCard({
    label, value, icon: Icon, iconColor = "text-[#FF6B35]", iconBg = "bg-[#FF6B35]/10",
    trend, href, urgent = false
}: AdminStatsCardProps) {
    const card = (
        <div className={cn(
            "group relative flex items-center gap-4 rounded-3xl border border-border bg-background p-6 shadow-sm transition-all duration-300",
            href && "hover:scale-[1.02] hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5",
            urgent && Number(value) > 0 && "border-orange-200 bg-orange-50/30"
        )}>
            {/* Glossy Icon Container */}
            <div className={cn(
                "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:rotate-6",
                iconBg,
                "after:absolute after:inset-0 after:rounded-2xl after:bg-white/10 after:opacity-50 after:backdrop-blur-[2px]"
            )}>
                <Icon className={cn("relative z-10 h-7 w-7", iconColor)} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                    <p className={cn(
                        "text-3xl font-black tracking-tighter",
                        urgent && Number(value) > 0 ? "text-orange-600" : "text-foreground"
                    )}>
                        {value}
                    </p>
                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            trend.value > 0 ? "bg-green-100 text-green-700" : trend.value < 0 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                        )}>
                            {trend.value > 0 ? <TrendingUp className="h-3 w-3" /> : trend.value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {trend.value > 0 ? "+" : ""}{trend.value}%
                        </div>
                    )}
                </div>
                {trend?.label && (
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground/60">{trend.label}</p>
                )}
            </div>

            {/* Subtle indicator for interactive cards */}
            {href && (
                <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
            )}
        </div>
    );

    return href ? <Link href={href}>{card}</Link> : card;
}
