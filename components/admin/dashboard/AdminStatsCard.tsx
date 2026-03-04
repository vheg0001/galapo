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
            "flex items-center gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm transition",
            href && "hover:shadow-md hover:border-[#FF6B35]/30",
            urgent && Number(value) > 0 && "border-orange-200 bg-orange-50/50"
        )}>
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", iconBg)}>
                <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={cn(
                    "text-2xl font-extrabold tracking-tight",
                    urgent && Number(value) > 0 ? "text-orange-600" : "text-foreground"
                )}>
                    {value}
                </p>
                {trend !== undefined && (
                    <p className={cn(
                        "mt-0.5 flex items-center gap-1 text-xs font-medium",
                        trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {trend.value > 0 ? <TrendingUp className="h-3 w-3" /> : trend.value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label ?? "vs last month"}
                    </p>
                )}
            </div>
        </div>
    );

    return href ? <Link href={href}>{card}</Link> : card;
}
