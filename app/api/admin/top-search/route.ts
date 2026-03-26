import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";
import { notifyOwner } from "@/lib/admin-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) {
            return auth.error;
        }
        const supabase = createAdminSupabaseClient();
        const { searchParams } = new URL(req.url);
        const now = new Date().toISOString();

        // ─── GROUPED FORMAT (for Slots By Category view) ───────────────────────
        if (searchParams.get("format") === "grouped") {
            const [
                { data: categories, error: catErr },
                { data: allPlacements, error: placErr }
            ] = await Promise.all([
                supabase
                    .from("categories")
                    .select("id, name, slug, icon")
                    .order("name"),
                supabase
                    .from("top_search_placements")
                    .select("*, listings ( id, business_name, slug, logo_url, owner_id )")
                    .eq("is_active", true)
                    .gte("end_date", now)
                    .order("start_date", { ascending: true }) // Show current/closest first
            ]);

            if (catErr) throw catErr;
            if (placErr) console.warn("Placements query warning:", placErr);

            const shaped = (categories || []).map(cat => {
                const catPlacements = (allPlacements || []).filter(p => p.category_id === cat.id);
                const slots = [1, 2, 3].map(pos => {
                    // Find the current active placement for this position if exists, otherwise fallback to any active/future one
                    const positionPlacements = catPlacements.filter(cp => cp.position === pos);
                    const current = positionPlacements.find(cp => {
                        const start = new Date(cp.start_date);
                        const end = new Date(cp.end_date);
                        const curr = new Date(now);
                        return start <= curr && end >= curr;
                    });
                    const p = current || positionPlacements[0]; // Fallback to the soonest upcoming one

                    return {
                        position: pos,
                        is_available: !p,
                        placement: p ? { ...p, listing_id: p.listing_id, listings: p.listings } : null,
                        listing: p?.listings || null,
                    };
                });
                return { category: cat, slots };
            });

            return NextResponse.json({ success: true, data: shaped });
        }

        // ─── STANDARD LIST FORMAT ────────────────────────────────────────────────
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

        if (status === "active") {
            query = query.eq("is_active", true).lte("start_date", now).gte("end_date", now);
        } else if (status === "expired") {
            query = query.lt("end_date", now);
        }

        if (categorySlug) {
            query = query.eq("categories.slug", categorySlug);
        }

        const { data, count, error } = await query
            .order("category_id")
            .order("position")
            .range(offset, offset + limit - 1);

        if (error) throw error;

        const { count: activeCount } = await supabase
            .from("top_search_placements").select("*", { count: "exact", head: true })
            .eq("is_active", true).lte("start_date", now).gte("end_date", now);
        const { count: expiredCount } = await supabase
            .from("top_search_placements").select("*", { count: "exact", head: true })
            .lt("end_date", now);

        // Flatten for table display
        const flattened = (data || []).map(p => ({
            ...p,
            business_name: (p.listings as any)?.business_name || "Unknown Business",
            category_name: (p.categories as any)?.name || "Unknown Category"
        }));

        return NextResponse.json({
            success: true,
            data: flattened,
            total: count || 0,
            stats: { active: activeCount || 0, expired: expiredCount || 0 }
        });

    } catch (error: any) {
        console.error("Top Search GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) return auth.error;
        const body = await req.json();
        const { listing_id, category_id, position, start_date, end_date, is_complimentary } = body;
        const supabase = createAdminSupabaseClient();

        // Validate position isn't taken
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

        const { data: listing } = await supabase
            .from("listings")
            .select("owner_id, business_name")
            .eq("id", listing_id)
            .single();

        if (listing) {
            // Assign 'sponsored' badge in listing_badges
            const { error: badgeError } = await supabase
                .from("listing_badges")
                .upsert({
                    listing_id,
                    badge_id: "sponsored",
                    is_active: true,
                    assigned_by: (auth as any).user.id,
                    assigned_at: new Date().toISOString()
                }, { onConflict: "listing_id,badge_id" });

            if (badgeError) {
                console.warn("Failed to assign sponsored badge:", badgeError);
            }

            const { data: category } = await supabase
                .from("categories").select("name").eq("id", category_id).single();
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
