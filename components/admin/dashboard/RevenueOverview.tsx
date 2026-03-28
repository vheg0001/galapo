"use client";

import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val);

interface RevenueBreakdownItem {
    label: string;
    amount: number;
    color: string;
}

interface RevenueOverviewProps {
    thisMonth: number;
    lastMonth: number;
    allTime: number;
    breakdown: RevenueBreakdownItem[];
}

export default function RevenueOverview({ thisMonth, lastMonth, allTime, breakdown }: RevenueOverviewProps) {
    const maxBreakdown = Math.max(...breakdown.map((item) => item.amount), 1);
    const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
    const monthChangeBadge = lastMonth <= 0
        ? thisMonth > 0
            ? "New"
            : null
        : `${monthChange >= 0 ? "▲" : "▼"} ${Math.abs(monthChange).toFixed(1)}%`;
    const monthChangeClassName = lastMonth <= 0 || (monthChange ?? 0) >= 0
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700";

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-sm ring-1 ring-border/50">
            <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-muted-foreground/50">Revenue Performance</h3>

            <div className="mb-8 grid grid-cols-3 gap-4">
                {[
                    { label: "This Month", value: thisMonth, badge: monthChangeBadge },
                    { label: "Last Month", value: lastMonth, badge: null },
                    { label: "All Time", value: allTime, badge: null },
                ].map((item, idx) => (
                    <div
                        key={item.label}
                        className={cn(
                            "rounded-2xl border border-border/40 p-4 transition-all hover:bg-muted/30",
                            idx === 0 && "bg-primary/[0.03] border-primary/10 ring-1 ring-primary/5"
                        )}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">{item.label}</p>
                        <p
                            className={cn(
                                "mt-1 text-xl font-black tracking-tighter",
                                idx === 0 ? "text-primary" : "text-foreground"
                            )}
                        >
                            {formatCurrency(item.value)}
                        </p>
                        {item.badge && (
                            <span
                                className={cn(
                                    "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide uppercase",
                                    monthChangeClassName
                                )}
                            >
                                {item.badge}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1 space-y-5">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Revenue Stream Breakdown</p>
                </div>
                {breakdown.map((item) => (
                    <div key={item.label} className="group">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground transition-colors group-hover:text-foreground">{item.label}</span>
                            <span className="tracking-tight text-foreground">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50 ring-1 ring-border/20">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.color)}
                                style={{ width: `${(item.amount / maxBreakdown) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
