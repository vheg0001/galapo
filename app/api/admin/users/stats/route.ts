import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Single concurrent fetch payload
        const [
            { count: totalCount },
            { count: monthCount },
            { count: activeCount },
            { count: activeSubsCount },
            { count: pendingListingsCount },
            { data: profiles }
        ] = await Promise.all([
            admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "business_owner"),
            admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "business_owner").gte("created_at", startOfMonth),
            admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "business_owner").eq("is_active", true),
            admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
            admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
            // to calculate 6-month registration trend
            admin.from("profiles").select("created_at").eq("role", "business_owner")
        ]);

        // Process trend logic safely assuming 'data: profiles' arrives containing only business_owner
        const trendMap = new Map<string, number>();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Populate last 6 months starting from current month going backwards
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            trendMap.set(key, 0);
        }

        (profiles || []).forEach(p => {
            if (!p.created_at) return;
            const d = new Date(p.created_at);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (trendMap.has(key)) {
                trendMap.set(key, (trendMap.get(key) || 0) + 1);
            }
        });

        const registration_trend = Array.from(trendMap.entries()).map(([month, count]) => ({ month, count }));

        return NextResponse.json({
            total_registered: totalCount ?? 0,
            registered_this_month: monthCount ?? 0,
            active_users: activeCount ?? 0,
            with_subscriptions: activeSubsCount ?? 0,
            with_pending_listings: pendingListingsCount ?? 0,
            registration_trend
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
