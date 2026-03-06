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
        const [catRes, fieldsRes] = await Promise.all([
            admin.from("categories").select("*").eq("id", id).single(),
            admin.from("category_fields")
                .select("*")
                .eq("category_id", id)
                .order("sort_order", { ascending: true }),
        ]);

        if (catRes.error) throw catRes.error;
        if (!catRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ data: catRes.data, fields: fieldsRes.data ?? [] });
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
