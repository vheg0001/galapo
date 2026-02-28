import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────
// GalaPo — Notifications API Route
// GET /api/notifications
// ──────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread_only") === "true";
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const offset = (page - 1) * limit;

        const supabase = await createServerSupabaseClient();

        // 1. Fetch paginated notifications
        let query = supabase
            .from("notifications")
            .select("*", { count: "exact" })
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq("is_read", false);
        }

        const { data: notifications, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 2. Fetch total unread count (regardless of current page/filter)
        const { count: unreadCount, error: countError } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)
            .eq("is_read", false);

        if (countError) {
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        return NextResponse.json({
            data: notifications,
            meta: {
                total: count,
                page,
                limit,
                totalPages: count ? Math.ceil(count / limit) : 0,
                unread_count: unreadCount || 0,
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
