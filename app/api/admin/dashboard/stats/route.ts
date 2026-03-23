import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAdminDashboardStats } from "@/lib/admin-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const stats = await getAdminDashboardStats();
        return NextResponse.json(stats);
    } catch (err: any) {
        console.error("[admin/dashboard/stats]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
