import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Bulk updates the priority of many badges at once for drag-and-drop.
 */
export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        // Body format: [{ id: "...", priority: 10 }, { id: "...", priority: 20 }, ...]
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Invalid payload format. Expected an array." }, { status: 400 });
        }

        // We use a Promise.all or manual loop for multiple updates
        // Supabase doesn't have a built-in bulk update for differing values across rows based on ID, 
        // but we can efficiently trigger multiple updates.

        await Promise.all(
            body.map(item =>
                admin
                    .from("badges")
                    .update({ priority: item.priority })
                    .eq("id", item.id)
            )
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
