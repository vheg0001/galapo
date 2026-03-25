import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) return auth.error;
        const supabase = await createServerSupabaseClient();

        // 1. Get all parent categories
        const { data: categories, error: catErr } = await supabase
            .from("categories")
            .select("id, name, slug, icon")
            .order("name");
        
        if (catErr) throw catErr;

        // 2. Get active placements with mapping to position
        const now = new Date().toISOString();
        const { data: placements } = await supabase
            .from("top_search_placements")
            .select(`
                *,
                listings ( id, business_name, slug, logo_url, owner_id, status ),
                users:listing_id ( id, owner_id, profiles!owner_id ( full_name, email ) )
            `)
            .eq("is_active", true)
            .lte("start_date", now)
            .gte("end_date", now);

        // Shape data
        const shaped = categories.map(cat => {
            const catPlacements = (placements || []).filter(p => p.category_id === cat.id);
            
            const slots = [1, 2, 3].map(pos => {
                const p = catPlacements.find(cp => cp.position === pos);
                return {
                    position: pos,
                    placement: p ? { id: p.id, start_date: p.start_date, end_date: p.end_date } : null,
                    listing: p?.listings || null,
                    owner: p?.listings?.owner_id ? { id: p.listings.owner_id } : null // Simple owner info
                };
            });

            return {
                category: cat,
                slots,
                total_revenue: 0 // Placeholder
            };
        });

        return NextResponse.json({ success: true, data: shaped });

    } catch (error: any) {
        console.error("Top Search Overview GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
