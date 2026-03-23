import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const ADMIN_NOTIFICATION_TYPES = [
    "new_listing_submitted", "new_payment_uploaded", "new_claim_request",
    "listing_approved", "listing_rejected", "annual_check_flagged", "annual_check_no_response"
];

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminSupabaseClient();
        const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
        if (profile?.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

        const { data, error } = await admin
            .from("notifications")
            .select("id, type, title, message, created_at, data")
            .in("type", ADMIN_NOTIFICATION_TYPES)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ activities: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
