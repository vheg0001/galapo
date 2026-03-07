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
        const { data, error } = await admin
            .from("category_fields")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: "Field not found." }, { status: 404 });

        return NextResponse.json({ data });
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
        const allowed = [
            "field_name", "field_label", "field_type", "is_required", "placeholder",
            "help_text", "options", "validation_rules", "sort_order", "is_active", "subcategory_id"
        ];

        const updatePayload: Record<string, any> = {};
        for (const key of allowed) {
            if (key in body) updatePayload[key] = body[key];
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
        }

        const { data, error } = await admin
            .from("category_fields")
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

// PUT is an alias for PATCH
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
        // Check if any listings have values for this field
        const { count } = await admin
            .from("listing_field_values")
            .select("id", { count: "exact", head: true })
            .eq("field_id", id)
            .throwOnError();

        // Delete listing field values first
        if (count && count > 0) {
            await admin.from("listing_field_values").delete().eq("field_id", id);
        }

        const { error } = await admin.from("category_fields").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true, cleared_values: count ?? 0 });
    } catch (error: any) {
        console.error("Delete field error:", error);
        return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }
}
