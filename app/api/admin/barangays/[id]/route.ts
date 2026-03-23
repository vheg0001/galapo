import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

        // Handle bulk reorder
        if (body.reorder && Array.isArray(body.items)) {
            await Promise.all(
                body.items.map((item: { id: string; sort_order: number }) =>
                    admin.from("barangays").update({ sort_order: item.sort_order }).eq("id", item.id)
                )
            );
            return NextResponse.json({ success: true });
        }

        const allowed = ["name", "slug", "sort_order", "is_active"];
        const updatePayload: Record<string, any> = {};
        for (const key of allowed) {
            if (key in body) updatePayload[key] = body[key];
        }

        const { data, error } = await admin
            .from("barangays")
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { count } = await admin
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("barangay_id", id);

        if (count && count > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${count} listing(s) reference this barangay.` },
                { status: 409 }
            );
        }

        const { error } = await admin.from("barangays").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
