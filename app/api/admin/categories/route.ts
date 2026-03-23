import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        // Fetch all categories (including inactive) with subcategories
        const { data: categories, error: catError } = await admin
            .from("categories")
            .select("id, name, slug, icon, parent_id, sort_order, description, is_active, created_at")
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });

        if (catError) throw catError;

        // Fetch listing counts for all categories
        const { data: listings } = await admin
            .from("listings")
            .select("id, category_id, subcategory_id");

        const countMap: Record<string, number> = {};
        listings?.forEach((l) => {
            countMap[l.category_id] = (countMap[l.category_id] || 0) + 1;
            if (l.subcategory_id) {
                countMap[l.subcategory_id] = (countMap[l.subcategory_id] || 0) + 1;
            }
        });

        // Build tree
        const allCats = (categories ?? []).map((c) => ({
            ...c,
            listing_count: countMap[c.id] || 0,
            subcategories: [] as any[],
        }));

        const parents = allCats.filter((c) => !c.parent_id);
        const subs = allCats.filter((c) => !!c.parent_id);

        parents.forEach((p) => {
            p.subcategories = subs.filter((s) => s.parent_id === p.id);
        });

        return NextResponse.json({ data: parents });
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
        const { name, slug, description, icon, parent_id, sort_order, is_active } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
        }

        const { data, error } = await admin
            .from("categories")
            .insert({
                name,
                slug,
                description: description || null,
                icon: icon || null,
                parent_id: parent_id || null,
                sort_order: sort_order ?? 0,
                is_active: is_active ?? true,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
