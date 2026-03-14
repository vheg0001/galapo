import { type NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

// ─────────────────────────────────────────────────────────────────────────────
// GalaPo Admin Helpers (Module 10.2)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Auth guard ──────────────────────────────────────────────────────────────

/**
 * requireAdmin — verifies the request comes from an authenticated super_admin.
 * Returns { userId, adminClient } on success, or a NextResponse 401/403 on failure.
 */
export async function requireAdmin(request?: NextRequest): Promise<
    | { userId: string; adminClient: ReturnType<typeof createAdminSupabaseClient> }
    | { error: NextResponse }
> {
    const session = await getServerSession();
    if (!session?.user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const adminClient = createAdminSupabaseClient();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role, is_active")
        .eq("id", session.user.id)
        .single();

    if (!profile || profile.role !== "super_admin" || !profile.is_active) {
        return { error: NextResponse.json({ error: "Forbidden — Admin access only" }, { status: 403 }) };
    }

    return { userId: session.user.id, adminClient };
}

// ─── Stats aggregator ────────────────────────────────────────────────────────

export async function getAdminDashboardStats() {
    const admin = createAdminSupabaseClient();
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const startOfLastListingMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastListingMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [
        { count: totalActiveListings },
        { count: listingsLastMonth },
        { count: pendingApprovals },
        { count: pendingPayments },
        { count: pendingClaims },
        { count: activeSubscriptions },
        { data: viewsThisMonthRows },
        { data: viewsLastMonthRows },
        { count: totalBusinessOwners },
        { data: revenueThisMonthRows },
        { data: revenueLastMonthRows },
        { data: allTimeRevenueRows },
        { data: subscriptionRevenue },
        { data: annualChecksDue },
        { data: annualChecksNoResponse },
    ] = await Promise.all([
        admin.from("listings").select("id", { count: "exact", head: true }).eq("is_active", true).in("status", ["approved", "claimed_pending"]),
        admin.from("listings").select("id", { count: "exact", head: true }).eq("is_active", true).gte("created_at", startOfLastListingMonth).lte("created_at", endOfLastListingMonth),
        admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "claimed_pending"),
        admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        admin.from("listing_analytics").select("id").eq("event_type", "page_view").gte("created_at", startOfMonth),
        admin.from("listing_analytics").select("id").eq("event_type", "page_view").gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
        admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "business_owner"),
        admin.from("payments").select("amount, description").eq("status", "verified").gte("verified_at", startOfMonth),
        admin.from("payments").select("amount").eq("status", "verified").gte("verified_at", startOfLastMonth).lte("verified_at", endOfLastMonth),
        admin.from("payments").select("amount").eq("status", "verified"),
        admin.from("payments").select("amount, description").eq("status", "verified").gte("verified_at", startOfMonth),
        admin.from("annual_checks").select("id").eq("status", "pending").lte("response_deadline", nextWeek).gte("response_deadline", now.toISOString().split("T")[0]),
        admin.from("annual_checks").select("id").eq("status", "no_response"),
    ]);

    const sum = (rows: { amount: number }[] | null) =>
        (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

    const thisMonth = sum(revenueThisMonthRows as any);
    const lastMonth = sum(revenueLastMonthRows as any);
    const allTime = sum(allTimeRevenueRows as any);

    // Revenue breakdown — based on plan_type in payments
    const breakdown = { subscriptions: 0, ad_placements: 0, top_search: 0, reactivation_fees: 0 };
    (revenueThisMonthRows ?? []).forEach((p: any) => {
        const description = String(p.description ?? "").toLowerCase();
        if (description.includes("ad")) breakdown.ad_placements += Number(p.amount);
        else if (description.includes("top search")) breakdown.top_search += Number(p.amount);
        else if (description.includes("reactivation")) breakdown.reactivation_fees += Number(p.amount);
        else breakdown.subscriptions += Number(p.amount);
    });

    const viewsThisMonth = viewsThisMonthRows?.length ?? 0;
    const viewsLastMonth = viewsLastMonthRows?.length ?? 0;
    const viewsChange = viewsLastMonth > 0 ? Math.round(((viewsThisMonth - viewsLastMonth) / viewsLastMonth) * 100) : 0;

    const currentActive = totalActiveListings ?? 0;
    const previousActive = listingsLastMonth ?? 0;
    const listingsChange = previousActive > 0 ? Math.round(((currentActive - previousActive) / previousActive) * 100) : 0;

    return {
        total_active_listings: currentActive,
        listings_change: listingsChange,
        pending_approvals: pendingApprovals ?? 0,
        pending_payments: pendingPayments ?? 0,
        pending_claims: pendingClaims ?? 0,
        active_subscriptions: activeSubscriptions ?? 0,
        total_page_views_this_month: viewsThisMonth,
        views_change: viewsChange,
        total_business_owners: totalBusinessOwners ?? 0,
        revenue_this_month: thisMonth,
        revenue_last_month: lastMonth,
        revenue_all_time: allTime,
        revenue_breakdown: breakdown,
        annual_checks_due_this_week: annualChecksDue?.length ?? 0,
        annual_checks_no_response: annualChecksNoResponse?.length ?? 0,
    };
}

// ─── Quick pending counts ─────────────────────────────────────────────────────

export async function getPendingCounts() {
    const admin = createAdminSupabaseClient();
    const [
        { count: listings },
        { count: payments },
        { count: claims },
    ] = await Promise.all([
        admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "claimed_pending"),
    ]);
    return { listings: listings ?? 0, payments: payments ?? 0, claims: claims ?? 0 };
}

// ─── Activity timeline formatter ──────────────────────────────────────────────

const ACTIVITY_TYPE_MAP: Record<string, { title: (d: any) => string; description: (d: any) => string; link: (d: any) => string }> = {
    new_listing_submitted: {
        title: (d) => "New Listing Submitted",
        description: (d) => `"${d?.listing_name ?? "A listing"}" is awaiting review.`,
        link: (d) => `/admin/listings/${d?.listing_id ?? ""}`,
    },
    new_payment_uploaded: {
        title: (d) => "Payment Proof Uploaded",
        description: (d) => `${d?.user_name ?? "A user"} uploaded proof for ₱${d?.amount ?? "—"}.`,
        link: (d) => `/admin/payments/${d?.payment_id ?? ""}`,
    },
    new_claim_request: {
        title: (d) => "Claim Request Received",
        description: (d) => `${d?.user_name ?? "A user"} claims "${d?.listing_name ?? "a listing"}".`,
        link: (d) => `/admin/claims/${d?.listing_id ?? ""}`,
    },
    listing_approved: {
        title: (d) => "Listing Approved",
        description: (d) => `"${d?.listing_name ?? "A listing"}" was approved and is now live.`,
        link: (d) => `/admin/listings/${d?.listing_id ?? ""}`,
    },
    listing_rejected: {
        title: (d) => "Listing Rejected",
        description: (d) => `"${d?.listing_name ?? "A listing"}" was rejected.`,
        link: (d) => `/admin/listings/${d?.listing_id ?? ""}`,
    },
    annual_check_flagged: {
        title: (d) => "Annual Check Flagged",
        description: (d) => `"${d?.listing_name ?? "A listing"}" annual check was flagged.`,
        link: (d) => `/admin/annual-checks`,
    },
    annual_check_no_response: {
        title: (d) => "Annual Check — No Response",
        description: (d) => `"${d?.listing_name ?? "A listing"}" did not respond to its annual check.`,
        link: (d) => `/admin/annual-checks`,
    },
};

export function formatAdminActivity(rows: any[]): {
    type: string; title: string; description: string;
    user_name: string; timestamp: string; link: string;
}[] {
    return rows.map((row) => {
        const cfg = ACTIVITY_TYPE_MAP[row.type];
        const data = row.data ?? {};
        return {
            type: row.type,
            title: cfg ? cfg.title(data) : row.title ?? row.type,
            description: cfg ? cfg.description(data) : row.message ?? "",
            user_name: data.user_name ?? data.owner_name ?? "System",
            timestamp: row.created_at,
            link: cfg ? cfg.link(data) : "/admin/dashboard",
        };
    });
}
