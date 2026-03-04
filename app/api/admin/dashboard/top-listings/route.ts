import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Period = "this_month" | "last_month" | "all_time";

function getPeriodRange(period: Period): { start: string | null; end: string | null } {
    const now = new Date();
    if (period === "this_month") {
        return {
            start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            end: null,
        };
    }
    if (period === "last_month") {
        return {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
        };
    }
    return { start: null, end: null };
}

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "this_month") as Period;
    const { start, end } = getPeriodRange(period);

    try {
        const admin = createAdminSupabaseClient();

        // Aggregate views per listing from listing_analytics
        let analyticsQuery = admin
            .from("listing_analytics")
            .select("listing_id")
            .eq("event_type", "page_view");
        if (start) analyticsQuery = analyticsQuery.gte("created_at", start);
        if (end) analyticsQuery = analyticsQuery.lte("created_at", end);

        const { data: views } = await analyticsQuery;

        // Count views per listing
        const viewMap: Record<string, number> = {};
        (views ?? []).forEach((r: any) => {
            viewMap[r.listing_id] = (viewMap[r.listing_id] ?? 0) + 1;
        });

        // Count clicks per listing
        let clickQuery = admin
            .from("listing_analytics")
            .select("listing_id")
            .eq("event_type", "click");
        if (start) clickQuery = clickQuery.gte("created_at", start);
        if (end) clickQuery = clickQuery.lte("created_at", end);

        const { data: clicks } = await clickQuery;
        const clickMap: Record<string, number> = {};
        (clicks ?? []).forEach((r: any) => {
            clickMap[r.listing_id] = (clickMap[r.listing_id] ?? 0) + 1;
        });

        const topIds = Object.entries(viewMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id]) => id);

        if (topIds.length === 0) return NextResponse.json({ listings: [] });

        const { data: listings } = await admin
            .from("listings")
            .select(`
                id, business_name, slug, is_premium, is_featured,
                categories!listings_category_id_fkey(name),
                profiles!listings_owner_id_fkey(full_name)
            `)
            .in("id", topIds);

        const result = topIds.map((id, i) => {
            const l = (listings ?? []).find((x: any) => x.id === id);
            return {
                rank: i + 1,
                id,
                slug: l?.slug ?? "",
                listing_name: l?.business_name ?? "Unknown",
                category: (l?.categories as any)?.name ?? "—",
                views: viewMap[id] ?? 0,
                clicks: clickMap[id] ?? 0,
                plan_type: l?.is_premium ? "premium" : l?.is_featured ? "featured" : "free",
                owner_name: (l?.profiles as any)?.full_name ?? "Unregistered",
            };
        });

        return NextResponse.json({ listings: result, period });
    } catch (err: any) {
        console.error("[admin/dashboard/top-listings]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
