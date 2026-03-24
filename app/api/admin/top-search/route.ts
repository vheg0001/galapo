import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-helpers";
import { notifyOwner } from "@/lib/admin-helpers";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createServerSupabaseClient();
        const { searchParams } = new URL(req.url);

        const status = searchParams.get("status") || "all";
        const categorySlug = searchParams.get("category_slug");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        let query = supabase
            .from("top_search_placements")
            .select(`
                *,
                listings ( id, business_name, slug, logo_url, owner_id ),
                categories ( id, name, slug )
            `, { count: "exact" });

        // Filter by status
        const now = new Date().toISOString();
        if (status === "active") {
            query = query.eq("is_active", true).lte("start_date", now).gte("end_date", now);
        } else if (status === "expired") {
            query = query.lt("end_date", now);
        }

        // Filter by category
        if (categorySlug) {
            // Join condition for category slug
            query = query.eq("categories.slug", categorySlug);
        }

        const { data, count, error } = await query
            .order("category_id")
            .order("position")
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Get status counts
        const { count: activeCount } = await supabase.from("top_search_placements").select("*", { count: "exact", head: true }).eq("is_active", true).lte("start_date", now).gte("end_date", now);
        const { count: expiredCount } = await supabase.from("top_search_placements").select("*", { count: "exact", head: true }).lt("end_date", now);

        return NextResponse.json({
            success: true,
            data: data || [],
            total: count || 0,
            stats: {
                active: activeCount || 0,
                expired: expiredCount || 0
            }
        });

    } catch (error: any) {
        console.error("Top Search GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json();
        const { listing_id, category_id, position, start_date, end_date, is_complimentary } = body;
        const supabase = await createServerSupabaseClient();

        // 1. Validate position isn't taken
        const { data: existing } = await supabase
            .from("top_search_placements")
            .select("id")
            .eq("category_id", category_id)
            .eq("position", position)
            .eq("is_active", true)
            .gte("end_date", new Date().toISOString());

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: "Position already occupied." }, { status: 409 });
        }

        // 2. Insert placement
        const { data: placement, error } = await supabase
            .from("top_search_placements")
            .insert({
                listing_id, category_id, position, start_date, end_date,
                is_active: true,
                notes: is_complimentary ? "Admin Complimentary" : "Paid Placement"
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Assign "Sponsored" badge to listing
        // Note: badges are usually in a JSONB array or related table. Assuming listing.badges
        const { data: listing } = await supabase.from("listings").select("badges, owner_id, business_name").eq("id", listing_id).single();
        if (listing) {
            const badges = Array.isArray(listing.badges) ? listing.badges : [];
            if (!badges.includes("sponsored")) {
                await supabase.from("listings").update({ 
                    badges: [...badges, "sponsored"] 
                }).eq("id", listing_id);
            }

            // 4. Notify owner
            const { data: category } = await supabase.from("categories").select("name").eq("id", category_id).single();
            await notifyOwner({
                ownerId: listing.owner_id,
                title: "Top Search Assigned!",
                message: `You've been assigned Top Search position #${position} in ${category?.name || 'Category'}!`
            });
        }

        return NextResponse.json({ success: true, data: placement });

    } catch (error: any) {
        console.error("Top Search POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
