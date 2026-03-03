import { NextResponse } from "next/server";
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

        // Requirements specify sources:
        // - Listing status changes
        // - Deals created/expired
        // - Events created
        // - Payments confirmed
        // - Subscription changes

        // Strategy: Pull from the "notifications" table as it already serves as an activity log
        // If we want raw data, we'd query multiple tables, but notifications usually consolidate this for users.
        // Let's query notifications first as the primary "Activity" source.

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
            .limit(10);

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
