"use client";

import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Phone, Mail, Globe, MapPin } from "lucide-react";

interface AnalyticsSummaryProps {
    analytics?: {
        total: number;
        views_this_month: number;
        phone: number;
        email: number;
        website: number;
        direction: number;
        daily_views_30d: { date: string; views: number }[];
    };
}

export default function AnalyticsSummary({ analytics }: AnalyticsSummaryProps) {
    const data = analytics ?? {
        total: 0,
        views_this_month: 0,
        phone: 0,
        email: 0,
        website: 0,
        direction: 0,
        daily_views_30d: [],
    };

    const maxViews = Math.max(1, ...data.daily_views_30d.map((x) => x.views));

    const stats = [
        { label: "Total Views", value: data.total, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "This Month", value: data.views_this_month, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Calls", value: data.phone, icon: Phone, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { label: "Emails", value: data.email, icon: Mail, color: "text-pink-500", bg: "bg-pink-500/10" },
        { label: "Web Link", value: data.website, icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10" },
        { label: "Navigation", value: data.direction, icon: MapPin, color: "text-red-500", bg: "bg-red-500/10" },
    ];

    return (
        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Traffic Analytics</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Engagement performance</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                    <div key={i} className="flex flex-col gap-1.5 rounded-2xl border border-border/30 bg-muted/20 p-3 transition-all hover:bg-muted/40">
                        <div className="flex items-center gap-2">
                            <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5", stat.bg, stat.color)}>
                                <stat.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{stat.label}</span>
                        </div>
                        <p className="text-lg font-black tracking-tight text-foreground">{stat.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Recent Activity (30d)</p>
                    <span className="text-[10px] font-bold text-primary">Peak: {maxViews}</span>
                </div>
                <div className="flex h-24 items-end gap-1.5 rounded-[1.5rem] bg-muted/40 p-3 ring-1 ring-border/50">
                    {data.daily_views_30d.length === 0 ? (
                        <div className="flex w-full items-center justify-center text-[10px] font-bold uppercase text-muted-foreground/40 italic">
                            No view data recorded
                        </div>
                    ) : (
                        data.daily_views_30d.map((d, i) => (
                            <div
                                key={i}
                                title={`${d.date}: ${d.views} views`}
                                className="group relative flex-1"
                                style={{ height: '100%' }}
                            >
                                <div
                                    className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-primary to-primary/60 transition-all duration-300 group-hover:from-primary/80 group-hover:to-primary"
                                    style={{ height: `${Math.max(4, (d.views / maxViews) * 100)}%` }}
                                />
                                {/* Tooltip on hover could go here or native title is fine */}
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-between px-1 text-[9px] font-heavy text-muted-foreground/40 uppercase tracking-widest">
                    <span>30 days ago</span>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}
