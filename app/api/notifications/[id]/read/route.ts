import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────
// GalaPo — Single Notification Read
// PATCH /api/notifications/[id]/read
// ──────────────────────────────────────────────────────────

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // In Next.js 15+, params is strictly handled as a promise in some configurations, but we can await it
) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const supabase = await createServerSupabaseClient();

        // Update the specific notification ONLY if it belongs to the current user
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)
            .eq("user_id", session.user.id); // Security: ensures user owns it

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
