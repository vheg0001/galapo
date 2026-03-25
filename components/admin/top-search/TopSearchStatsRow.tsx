import { Layers, Crosshair, DollarSign, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminSupabaseClient } from "@/lib/supabase";

async function getTopSearchStats() {
    const supabase = createAdminSupabaseClient();
    
    const now = new Date().toISOString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekIso = nextWeek.toISOString();

    const [
        { count: activeCount },
        { count: expiringCount },
        { data: allCategories }
    ] = await Promise.all([
        supabase
            .from("top_search_placements")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true)
            .gte("end_date", now),
        supabase
            .from("top_search_placements")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true)
            .gte("end_date", now)
            .lte("end_date", nextWeekIso),
        supabase
            .from("categories")
            .select("id")
    ]);

    const totalCategories = allCategories?.length || 0;
    const totalSlots = totalCategories * 3;
    const activePlacements = activeCount || 0;
    const availableSlots = Math.max(0, totalSlots - activePlacements);

    // Placeholder for revenue if paid manually or otherwise tracked
    const mrr = 0; 
    
    return {
        activePlacements,
        availableSlots,
        expiringWait: expiringCount || 0,
        revenue: mrr,
        totalSlots
    };
}

export async function TopSearchStatsRow() {
    const stats = await getTopSearchStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Active Placements
                    </CardTitle>
                    <Crosshair className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activePlacements}</div>
                    <p className="text-xs text-muted-foreground mt-1 text-green-600 flex items-center">
                        out of {stats.totalSlots} slots
                    </p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Available Slots
                    </CardTitle>
                    <Layers className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.availableSlots}</div>
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
                    <div className="text-2xl font-bold">Php {stats.revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1 text-green-600 flex items-center">
                        Est. MRR
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
