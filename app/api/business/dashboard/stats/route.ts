import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/business/dashboard/stats
 * Aggregates dashboard statistics for the authenticated business owner
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get date ranges for current month and last month
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        // 1. Fetch listings owned by this user
        const { data: listings, error: listingsError } = await supabase
            .from("listings")
            .select("id")
            .eq("owner_id", user.id);

        if (listingsError) throw listingsError;
        const listingIds = listings?.map(l => l.id) || [];

        if (listingIds.length === 0) {
            return NextResponse.json({
                total_listings: 0,
                total_views_this_month: 0,
                total_views_last_month: 0,
                views_change_percent: 0,
                total_clicks_this_month: 0,
                total_clicks_last_month: 0,
                clicks_change_percent: 0,
                active_deals: 0,
                active_subscriptions: 0
            });
        }

        // 2. Fetch analytics (views/clicks)
        // Simplified query logic: we sum events count
        const { data: analyticsCurrent, error: analyticsError } = await supabase
            .from("listing_analytics")
            .select("event_type")
            .in("listing_id", listingIds)
            .gte("created_at", startOfThisMonth);

        const { data: analyticsLast, error: analyticsLastError } = await supabase
            .from("listing_analytics")
            .select("event_type")
            .in("listing_id", listingIds)
            .gte("created_at", startOfLastMonth)
            .lte("created_at", endOfLastMonth);

        if (analyticsError || analyticsLastError) throw (analyticsError || analyticsLastError);

        const viewsThisMonth = analyticsCurrent?.filter(a => a.event_type === "page_view").length || 0;
        const clicksThisMonth = analyticsCurrent?.filter(a => a.event_type !== "page_view").length || 0;

        const viewsLastMonth = analyticsLast?.filter(a => a.event_type === "page_view").length || 0;
        const clicksLastMonth = analyticsLast?.filter(a => a.event_type !== "page_view").length || 0;

        // Calculate change percent
        const calculateChange = (current: number, last: number) => {
            if (last === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - last) / last) * 100);
        };

        const viewsChange = calculateChange(viewsThisMonth, viewsLastMonth);
        const clicksChange = calculateChange(clicksThisMonth, clicksLastMonth);

        // 3. Fetch active deals
        const { count: activeDeals, error: dealsError } = await supabase
            .from("deals")
            .select("*", { count: "exact", head: true })
            .in("listing_id", listingIds)
            .eq("is_active", true)
            .gte("end_date", now.toISOString());

        if (dealsError) throw dealsError;

        // 4. Fetch active subscriptions
        const { count: activeSubscriptions, error: subsError } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .in("listing_id", listingIds)
            .eq("status", "active")
            .gte("end_date", now.toISOString());

        if (subsError) throw subsError;

        return NextResponse.json({
            total_listings: listingIds.length,
            total_views_this_month: viewsThisMonth,
            total_views_last_month: viewsLastMonth,
            views_change_percent: viewsChange,
            total_clicks_this_month: clicksThisMonth,
            total_clicks_last_month: clicksLastMonth,
            clicks_change_percent: clicksChange,
            active_deals: activeDeals || 0,
            active_subscriptions: activeSubscriptions || 0
        });

    } catch (error: any) {
        console.error("[STATS_GET]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
