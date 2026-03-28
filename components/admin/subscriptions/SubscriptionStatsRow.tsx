"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, DollarSign, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SubscriptionStats = {
    active_featured: number;
    active_premium: number;
    expiring_this_week: number;
    active_mrr: number;
};

const DEFAULT_STATS: SubscriptionStats = {
    active_featured: 0,
    active_premium: 0,
    expiring_this_week: 0,
    active_mrr: 0,
};

function formatPeso(amount: number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function SubscriptionStatsRow({
    refreshKey = 0,
}: {
    refreshKey?: number;
}) {
    const [stats, setStats] = useState<SubscriptionStats>(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        setLoading(true);

        try {
            const response = await fetch("/api/admin/subscriptions/stats", {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Failed to load subscription stats.");
            }

            const json = await response.json();

            setStats({
                active_featured: Number(json.active_featured || 0),
                active_premium: Number(json.active_premium || 0),
                expiring_this_week: Number(json.expiring_this_week || 0),
                active_mrr: Number(json.active_mrr ?? json.revenue_this_month ?? 0),
            });
        } catch (error) {
            console.error("Failed to load subscription stats", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadStats();
    }, [loadStats, refreshKey]);

    const isRefreshing = loading && (
        stats.active_featured > 0 ||
        stats.active_premium > 0 ||
        stats.expiring_this_week > 0 ||
        stats.active_mrr > 0
    );

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className={isRefreshing ? "opacity-80 transition-opacity" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Featured
                    </CardTitle>
                    <Star className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.active_featured}</div>
                </CardContent>
            </Card>

            <Card className={isRefreshing ? "opacity-80 transition-opacity" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Premium
                    </CardTitle>
                    <Zap className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.active_premium}</div>
                </CardContent>
            </Card>

            <Card className={stats.expiring_this_week > 0 ? "border-orange-200 bg-orange-50/50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${stats.expiring_this_week > 0 ? "text-orange-700" : ""}`}>
                        Expiring This Week
                    </CardTitle>
                    <CalendarClock className={`h-4 w-4 ${stats.expiring_this_week > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.expiring_this_week > 0 ? "text-orange-700" : ""}`}>
                        {stats.expiring_this_week}
                    </div>
                </CardContent>
            </Card>

            <Card className={isRefreshing ? "opacity-80 transition-opacity" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active MRR
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatPeso(stats.active_mrr)}</div>
                    <p className="mt-1 text-xs text-green-600">
                        Current recurring revenue
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
