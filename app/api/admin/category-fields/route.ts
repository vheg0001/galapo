import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();

        // Handle bulk reorder
        if (body.reorder && Array.isArray(body.items)) {
            const updates = body.items.map((item: { id: string; sort_order: number }) =>
                admin.from("category_fields")
                    .update({ sort_order: item.sort_order })
                    .eq("id", item.id)
            );
            await Promise.all(updates);
            return NextResponse.json({ success: true });
        }

        const {
            category_id, subcategory_id, field_name, field_label, field_type,
            is_required, placeholder, help_text, options, validation_rules, sort_order, is_active
        } = body;

        if (!category_id || !field_name || !field_label || !field_type) {
            return NextResponse.json({ error: "category_id, field_name, field_label, and field_type are required." }, { status: 400 });
        }

        const { data, error } = await admin.from("category_fields").insert({
            category_id,
            subcategory_id: subcategory_id || null,
            field_name,
            field_label,
            field_type,
            is_required: is_required ?? false,
            placeholder: placeholder || null,
            help_text: help_text || null,
            options: options || null,
            validation_rules: validation_rules || null,
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
