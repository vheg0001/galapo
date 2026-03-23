import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, formatAdminActivity } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ADMIN_TYPES = [
    "new_listing_submitted", "new_payment_uploaded", "new_claim_request",
    "listing_approved", "listing_rejected", "annual_check_flagged", "annual_check_no_response"
];

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const offset = (page - 1) * limit;

    try {
        const admin = createAdminSupabaseClient();
        const { data, error, count } = await admin
            .from("notifications")
            .select("id, type, title, message, created_at, data", { count: "exact" })
            .in("type", ADMIN_TYPES)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            activities: formatAdminActivity(data ?? []),
            total: count ?? 0,
            page,
            limit,
        });
    } catch (err: any) {
        console.error("[admin/dashboard/activity]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
