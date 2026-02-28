import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────
// GalaPo — Mark All Notifications Read
// PATCH /api/notifications/read-all
// ──────────────────────────────────────────────────────────

export async function PATCH() {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        // Update all unread notifications for the current user
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", session.user.id)
            .eq("is_read", false);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
