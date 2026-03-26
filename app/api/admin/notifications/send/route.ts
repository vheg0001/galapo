import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/notifications/send
 * Send a notification to a specific user or broadcast to all business owners.
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const { recipient_id, type, title, message, link, broadcast = false } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }

        const admin = createAdminSupabaseClient();
        const now = new Date().toISOString();

        if (broadcast) {
            // Fetch all business owners
            const { data: owners, error: ownersErr } = await admin
                .from("profiles")
                .select("id")
                .eq("role", "business_owner");

            if (ownersErr) throw ownersErr;

            const notifications = (owners ?? []).map(owner => ({
                user_id: owner.id,
                type: type || "system",
                title,
                message,
                data: { link },
                is_read: false,
                created_at: now
            }));

            if (notifications.length > 0) {
                const { error: insertErr } = await admin.from("notifications").insert(notifications);
                if (insertErr) throw insertErr;
            }

            return NextResponse.json({ 
                sent_count: notifications.length,
                success: true, 
                message: `Broadcast sent to ${notifications.length} business owners.` 
            });
        } else {
            if (!recipient_id) {
                return NextResponse.json({ error: "recipient_id is required for non-broadcast notifications" }, { status: 400 });
            }

            const { error: insertErr } = await admin.from("notifications").insert({
                user_id: recipient_id,
                type: type || "system",
                title,
                message,
                data: { link },
                is_read: false,
                created_at: now
            });

            if (insertErr) throw insertErr;

            return NextResponse.json({ 
                sent_count: 1,
                success: true, 
                message: "Notification sent successfully." 
            });
        }
    } catch (err: any) {
        console.error("[admin/notifications/send POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
