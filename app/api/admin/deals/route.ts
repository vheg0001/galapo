import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // TODO: Add admin role check here when RBAC is fully implemented

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const barangay = searchParams.get("barangay");
    const listingSearch = searchParams.get("listing_search");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const offset = (page - 1) * limit;

    try {
        let query = supabase
            .from("deals")
            .select(`
                *,
                listings (
                    business_name,
                    slug,
                    owner:profiles (email, full_name)
                )
            `, { count: "exact" });

        // Filters
        if (status === "active") {
            query = query.eq("is_active", true).gte("end_date", new Date().toISOString());
        } else if (status === "expired") {
            query = query.lt("end_date", new Date().toISOString());
        } else if (status === "inactive") {
            query = query.eq("is_active", false);
        }

        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo);

        // Filters that require listing joins might need more complex logic or separate queries
        // but for now we'll handle basic ones.

        const { data, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Manual filtering for listing search if needed (PostgREST limitations)
        let filteredData = data || [];
        if (listingSearch) {
            filteredData = filteredData.filter(d =>
                d.listings?.business_name.toLowerCase().includes(listingSearch.toLowerCase())
            );
        }

        return NextResponse.json({
            data: (filteredData as any[]).map(d => ({
                id: d.id,
                title: d.title,
                discount_text: d.discount_text,
                is_active: d.is_active,
                created_at: d.created_at,
                listing_id: d.listing_id,
                business_name: d.listings?.business_name || "Unknown",
                owner_name: d.listings?.owner?.full_name || "N/A",
                owner_email: d.listings?.owner?.email || "No Email",
                end_date: d.end_date
            })),
            pagination: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error: any) {
        console.error("[api/admin/deals GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from("deals")
            .insert(body)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[api/admin/deals POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
