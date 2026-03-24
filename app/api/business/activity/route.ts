import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/business/activity
 * Fetch unified recent activity for the authenticated business owner
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: notifications, error: notifError } = await supabase
            .from("notifications")
            .select(`
                id,
                type,
                title,
                message,
                created_at,
                is_read,
                data
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

        if (notifError) throw notifError;

        // Transform into standardized ActivityItem format
        const activities = (notifications || []).map(n => {
            const extraData = n.data as any;
            return {
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                created_at: n.created_at,
                is_read: n.is_read,
                listing_id: extraData?.listing_id || null,
                listing_name: extraData?.listing_name || null
            };
        });

        return NextResponse.json(activities);

    } catch (error: any) {
        console.error("[ACTIVITY_GET]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PATCH /api/business/activity
 * Mark a specific notification or all notifications as read.
 * Body: { id?: string, all?: boolean }
 */
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, all } = body;

        let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);

        if (!all && id) {
            query = query.eq("id", id);
        } else if (!all && !id) {
            return NextResponse.json({ error: "Missing notification id or 'all' flag" }, { status: 400 });
        }

        const { error: updateError } = await query;
        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[ACTIVITY_PATCH]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
