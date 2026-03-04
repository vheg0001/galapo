import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminSupabaseClient();

        // Check super_admin role
        const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
        if (profile?.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        const [
            { count: totalListings },
            { count: pendingListings },
            { count: pendingPayments },
            { count: pendingClaims },
            { count: activeSubscriptions },
            { data: viewsThisMonth },
            { data: revenueThisMonth },
            { data: revenueLastMonth },
            { data: allTimeRevenue },
        ] = await Promise.all([
            admin.from("listings").select("id", { count: "exact", head: true }).eq("is_active", true).in("status", ["approved", "claimed_pending"]),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
            admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
            admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "claimed_pending"),
            admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
            admin.from("listing_analytics").select("id").eq("event_type", "page_view").gte("created_at", startOfMonth),
            admin.from("payments").select("amount").eq("status", "verified").gte("verified_at", startOfMonth),
            admin.from("payments").select("amount").eq("status", "verified").gte("verified_at", startOfLastMonth).lte("verified_at", endOfLastMonth),
            admin.from("payments").select("amount").eq("status", "verified"),
        ]);

        const sumAmount = (rows: { amount: number }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

        return NextResponse.json({
            total_listings: totalListings ?? 0,
            pending_listings: pendingListings ?? 0,
            pending_payments: pendingPayments ?? 0,
            pending_claims: pendingClaims ?? 0,
            active_subscriptions: activeSubscriptions ?? 0,
            total_views_this_month: viewsThisMonth?.length ?? 0,
            revenue: {
                this_month: sumAmount(revenueThisMonth as any),
                last_month: sumAmount(revenueLastMonth as any),
                all_time: sumAmount(allTimeRevenue as any),
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
