import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();

        if (!Array.isArray(body)) {
            return NextResponse.json(
                { error: "Expected an array of { id, sort_order }" },
                { status: 400 }
            );
        }

        const updates = (body as { id: string; sort_order: number }[]).map((item) =>
            admin
                .from("category_fields")
                .update({ sort_order: item.sort_order })
                .eq("id", item.id)
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
