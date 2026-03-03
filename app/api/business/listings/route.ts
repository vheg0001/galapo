import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/business/listings
 * Fetch all listings owned by the authenticated business owner
 */
export async function GET(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        // 1. Fetch listings with basic info and relationships
        const { data: listings, error: listingsError, count } = await supabase
            .from("listings")
            .select(`
                *,
                categories!category_id(name),
                subcategory:categories!subcategory_id(name),
                primary_image:listing_images(image_url)
            `, { count: "exact" })
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (listingsError) throw listingsError;

        if (!listings) return NextResponse.json({ data: [], total: 0 });

        // 2. Fetch monthly analytics per listing
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const listingIds = listings.map(l => l.id);
        const { data: analytics, error: analyticsError } = await supabase
            .from("listing_analytics")
            .select("listing_id, event_type")
            .in("listing_id", listingIds)
            .gte("created_at", startOfMonth);

        if (analyticsError) throw analyticsError;

        // 3. Map analytics back to listings
        const enrichedListings = listings.map(l => {
            const listingAnalytics = analytics?.filter(a => a.listing_id === l.id) || [];
            return {
                ...l,
                category_name: l.categories?.name || "Uncategorized",
                subcategory_name: l.subcategory?.name || null,
                primary_image: l.primary_image?.[0]?.image_url || null,
                views_this_month: listingAnalytics.filter(a => a.event_type === "page_view").length,
                clicks_this_month: listingAnalytics.filter(a => a.event_type !== "page_view").length,
                current_plan: l.is_premium ? "premium" : (l.is_featured ? "featured" : "free")
            };
        });

        return NextResponse.json({
            data: enrichedListings,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
            hasNextPage: offset + limit < (count || 0),
            hasPrevPage: page > 1
        });

    } catch (error: any) {
        console.error("[LISTINGS_GET]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
