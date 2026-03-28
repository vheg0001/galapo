import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { addMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const barangay = searchParams.get("barangay");
    const sort = searchParams.get("sort") || "expiring_soon";
    const featuredOnly = searchParams.get("featured_only") === "true";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = (page - 1) * limit;

    const today = new Date().toISOString();

    try {
        let query = supabase
            .from("deals")
            .select(`
                *,
                listing:listings (
                    id, business_name, slug, is_featured, is_premium,
                    category:categories!listings_category_id_fkey (name, slug),
                    barangay:barangays (name, slug),
                    listing_badges (
                        id, 
                        badge:badges (id, name, slug, icon, icon_lucide, color, text_color, type, priority)
                    )
                )
            `, { count: "exact" })
            .eq("is_active", true)
            .gte("end_date", today)
            .lte("start_date", addMonths(new Date(), 1).toISOString());

        // Filters
        if (category) query = query.eq("listing.category.slug", category);
        if (barangay) query = query.eq("listing.barangay.slug", barangay);
        if (featuredOnly) query = query.or("listing.is_featured.eq.true,listing.is_premium.eq.true");

        // Sorting
        if (sort === "expiring_soon") {
            query = query.order("end_date", { ascending: true });
        } else if (sort === "newest") {
            query = query.order("created_at", { ascending: false });
        } else if (sort === "category") {
            // Postgres sorting on joined table name is tricky in one go, 
            // but we can sort by listing title or just keep it simple.
            query = query.order("title", { ascending: true });
        }

        const { data, count, error } = await query.range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            data: data || [],
            pagination: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            },
            filters_applied: {
                category,
                barangay,
                sort,
                featured_only: featuredOnly
            }
        });
    } catch (error: any) {
        console.error("[api/deals GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
