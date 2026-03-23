import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getStartDate(period: string) {
    const now = new Date();
    if (period === "7d") {
        const date = new Date(now);
        date.setDate(date.getDate() - 6);
        return date;
    }
    if (period === "30d") {
        const date = new Date(now);
        date.setDate(date.getDate() - 29);
        return date;
    }
    if (period === "90d") {
        const date = new Date(now);
        date.setDate(date.getDate() - 89);
        return date;
    }
    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") ?? "30d";
        const startDate = getStartDate(period);

        let query = admin
            .from("listing_analytics")
            .select("event_type, created_at, event_data")
            .eq("listing_id", id);

        if (startDate) {
            query = query.gte("created_at", startDate.toISOString());
        }

        const { data, error } = await query.order("created_at", { ascending: true });
        if (error) throw error;

        const rows = data ?? [];
        const totalClicks = {
            phone: 0,
            email: 0,
            website: 0,
            directions: 0,
            social: 0,
            share: 0,
        };
        let totalViews = 0;

        const dailyViewsMap = new Map<string, number>();
        const dailyClicksMap = new Map<string, number>();
        const referrerMap = new Map<string, number>();

        rows.forEach((row: any) => {
            const date = String(row.created_at).slice(0, 10);
            const type = String(row.event_type);

            if (type === "page_view") {
                totalViews += 1;
                dailyViewsMap.set(date, (dailyViewsMap.get(date) ?? 0) + 1);
            } else {
                dailyClicksMap.set(date, (dailyClicksMap.get(date) ?? 0) + 1);
                if (type === "phone_click") totalClicks.phone += 1;
                if (type === "email_click") totalClicks.email += 1;
                if (type === "website_click") totalClicks.website += 1;
                if (type === "directions_click" || type === "direction_click") totalClicks.directions += 1;
                if (type === "social_click") totalClicks.social += 1;
                if (type === "share") totalClicks.share += 1;
            }

            const source = row.event_data?.source ?? row.event_data?.referrer ?? row.event_data?.platform;
            if (source) {
                const sourceKey = String(source);
                referrerMap.set(sourceKey, (referrerMap.get(sourceKey) ?? 0) + 1);
            }
        });

        const dailyViews = Array.from(dailyViewsMap.entries()).map(([date, count]) => ({ date, count }));
        const dailyClicks = Array.from(dailyClicksMap.entries()).map(([date, count]) => ({ date, count }));
        const topReferrers = Array.from(referrerMap.entries())
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return NextResponse.json({
            total_views: totalViews,
            total_clicks: totalClicks,
            daily_views: dailyViews,
            daily_clicks: dailyClicks,
            top_referrers: topReferrers,
        });
    } catch (error: any) {
        console.error("[admin/listings/[id]/analytics GET]", error);
        return NextResponse.json({ error: error.message ?? "Failed to fetch listing analytics" }, { status: 500 });
    }
}

