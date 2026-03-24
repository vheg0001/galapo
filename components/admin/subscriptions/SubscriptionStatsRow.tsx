import { ArrowUpRight, ArrowDownRight, Activity, CalendarClock, DollarSign, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getSubscriptionStats() {
    const supabase = await createServerSupabaseClient();
    
    // This is a simplified stats fetch. 
    // In a real scenario, you might have an RPC or specialized queries for accurate aggregations.
    const now = new Date().toISOString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekIso = nextWeek.toISOString();

    const [
        { count: featuredCount },
        { count: premiumCount },
        { count: expiringCount },
        { data: activeSubs }
    ] = await Promise.all([
        supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("plan_type", "featured")
            .eq("status", "active")
            .gte("end_date", now),
        supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("plan_type", "premium")
            .eq("status", "active")
            .gte("end_date", now),
        supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "active")
            .gte("end_date", now)
            .lte("end_date", nextWeekIso),
        supabase
            .from("subscriptions")
            .select("amount")
            .eq("status", "active")
            .gte("end_date", now)
    ]);

    const mrr = (activeSubs || []).reduce((sum, sub) => sum + (sub.amount || 0), 0);

    return {
        featured: featuredCount || 0,
        premium: premiumCount || 0,
        expiringWait: expiringCount || 0,
        revenue: mrr
    };
}

export async function SubscriptionStatsRow() {
    const stats = await getSubscriptionStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Featured
                    </CardTitle>
                    <Star className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.featured}</div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Premium
                    </CardTitle>
                    <Zap className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.premium}</div>
                </CardContent>
            </Card>
            
            <Card className={stats.expiringWait > 0 ? "border-orange-200 bg-orange-50/50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${stats.expiringWait > 0 ? "text-orange-700" : ""}`}>
                        Expiring This Week
                    </CardTitle>
                    <CalendarClock className={`h-4 w-4 ${stats.expiringWait > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.expiringWait > 0 ? "text-orange-700" : ""}`}>
                        {stats.expiringWait}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Monthly Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₱{stats.revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1 text-green-600 flex items-center">
                        Active MRR
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
