import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const catRes = await admin.from("categories").select("*").eq("id", id).single();

        if (catRes.error) throw catRes.error;
        if (!catRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const category = catRes.data;

        // Fetch fields:
        // 1. Fields specific to this subcategory (subcategory_id = id)
        // 2. Fields specific to this category (category_id = id AND subcategory_id IS NULL)
        // 3. Inherited fields from parent (parent category_id = parent_id AND subcategory_id IS NULL)
        const filterOr = [
            `subcategory_id.eq.${id}`,
            `and(category_id.eq.${id},subcategory_id.is.null)`
        ];

        if (category.parent_id) {
            filterOr.push(`and(category_id.eq.${category.parent_id},subcategory_id.is.null)`);

            // Try to fetch parent of parent as well just in case of deep nesting
            const { data: parent } = await admin.from("categories").select("parent_id").eq("id", category.parent_id).single();
            if (parent?.parent_id) {
                filterOr.push(`and(category_id.eq.${parent.parent_id},subcategory_id.is.null)`);
            }
        }

        const [fieldsRes, subsRes] = await Promise.all([
            admin.from("category_fields")
                .select("*")
                .or(filterOr.join(","))
                .order("sort_order", { ascending: true }),
            admin.from("categories")
                .select("id, name")
                .eq("parent_id", id)
                .order("sort_order", { ascending: true })
        ]);

        return NextResponse.json({
            data: category,
            fields: fieldsRes.data ?? [],
            subcategories: subsRes.data ?? []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const { name, slug, description, icon, parent_id, sort_order, is_active } = body;

        // Warn if deactivating a category with listings
        if (is_active === false) {
            const { count } = await admin
                .from("listings")
                .select("id", { count: "exact", head: true })
                .or(`category_id.eq.${id},subcategory_id.eq.${id}`);
            if (count && count > 0) {
                const updatePayload: Record<string, any> = { is_active: false };
                if (name !== undefined) updatePayload.name = name;
                if (slug !== undefined) updatePayload.slug = slug;
                if (description !== undefined) updatePayload.description = description;
                if (icon !== undefined) updatePayload.icon = icon;
                if (parent_id !== undefined) updatePayload.parent_id = parent_id || null;
                if (sort_order !== undefined) updatePayload.sort_order = sort_order;
                const { data, error } = await admin.from("categories").update(updatePayload).eq("id", id).select().single();
                if (error) throw error;
                return NextResponse.json({ data, warning: `${count} listing(s) still reference this category.` });
            }
        }

        const updatePayload: Record<string, any> = {};
        if (name !== undefined) updatePayload.name = name;
        if (slug !== undefined) updatePayload.slug = slug;
        if (description !== undefined) updatePayload.description = description;
        if (icon !== undefined) updatePayload.icon = icon;
        if (parent_id !== undefined) updatePayload.parent_id = parent_id || null;
        if (sort_order !== undefined) updatePayload.sort_order = sort_order;
        if (is_active !== undefined) updatePayload.is_active = is_active;

        const { data, error } = await admin
            .from("categories")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT is an alias for PATCH (spec requires PUT)
export const PUT = PATCH;

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        // Check if any listings use it
        const { count } = await admin
            .from("listings")
            .select("id", { count: "exact", head: true })
            .or(`category_id.eq.${id},subcategory_id.eq.${id}`);

        if (count && count > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${count} listing(s) use this category.` },
                { status: 409 }
            );
        }

        const { error } = await admin.from("categories").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
