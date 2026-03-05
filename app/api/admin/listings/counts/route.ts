import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const [
            pendingRes,
            approvedRes,
            rejectedRes,
            draftRes,
            claimedPendingRes,
            totalRes,
            activeRes,
            inactiveRes,
        ] = await Promise.all([
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "approved"),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "rejected"),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "draft"),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "claimed_pending"),
            admin.from("listings").select("id", { count: "exact", head: true }),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("is_active", true),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("is_active", false),
        ]);

        const errors = [
            pendingRes.error,
            approvedRes.error,
            rejectedRes.error,
            draftRes.error,
            claimedPendingRes.error,
            totalRes.error,
            activeRes.error,
            inactiveRes.error,
        ].filter(Boolean);
        if (errors.length) throw errors[0];

        return NextResponse.json({
            all: totalRes.count ?? 0,
            pending: pendingRes.count ?? 0,
            approved: approvedRes.count ?? 0,
            rejected: rejectedRes.count ?? 0,
            draft: draftRes.count ?? 0,
            claimed_pending: claimedPendingRes.count ?? 0,
            total: totalRes.count ?? 0,
            active: activeRes.count ?? 0,
            inactive: inactiveRes.count ?? 0,
        });
    } catch (error: any) {
        console.error("[admin/listings/counts GET]", error);
        return NextResponse.json({ error: error.message ?? "Failed to fetch listing counts" }, { status: 500 });
    }
}
