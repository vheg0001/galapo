import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const { data: barangays, error } = await admin
            .from("barangays")
            .select("id, name, slug, sort_order, is_active, city_id")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        // Listing counts
        const { data: listings } = await admin
            .from("listings")
            .select("id, barangay_id");

        const countMap: Record<string, number> = {};
        listings?.forEach((l) => {
            if (l.barangay_id) countMap[l.barangay_id] = (countMap[l.barangay_id] || 0) + 1;
        });

        const enriched = (barangays ?? []).map((b) => ({
            ...b,
            listing_count: countMap[b.id] || 0,
        }));

        return NextResponse.json({ data: enriched });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const { name, slug, sort_order, is_active, city_id } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
        }

        // Default city_id to Olongapo
        const targetCityId = city_id || "c0000000-0000-0000-0000-000000000001";

        const { data, error } = await admin.from("barangays").insert({
            name,
            slug,
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
            city_id: targetCityId,
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
