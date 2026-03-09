import { createAdminSupabaseClient } from "@/lib/supabase";
import ActivityFeed from "@/components/admin/dashboard/ActivityFeed";
import PendingItems from "@/components/admin/dashboard/PendingItems";
import RevenueOverview from "@/components/admin/dashboard/RevenueOverview";
import TopListings from "@/components/admin/dashboard/TopListings";
import AnnualChecksStatus from "@/components/admin/dashboard/AnnualChecksStatus";

export default async function AdminDashboardDeepSections() {
    const admin = createAdminSupabaseClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
        { data: revenueThisMonth },
        { data: revenueLastMonth },
        { data: allTimeRevenue },
        { data: pendingListingRows },
        { data: pendingPaymentRows },
        { data: pendingClaimRows },
        { data: activities },
        { data: topListingAnalytics },
        { count: annualChecksDue },
        { count: annualChecksNoResponse },
    ] = await Promise.all([
        admin.from("payments").select("amount, plan_type").eq("status", "verified").gte("verified_at", startOfMonth),
        admin.from("payments").select("amount").eq("status", "verified").gte("verified_at", startOfLastMonth).lte("verified_at", endOfLastMonth),
        admin.from("payments").select("amount").eq("status", "verified"),
        admin.from("listings").select("id, business_name, created_at, status, profiles!listings_owner_id_fkey(full_name)").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
        admin.from("payments").select("id, amount, description, created_at, status, profiles!payments_user_id_fkey(full_name, email)").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
        admin.from("listings").select("id, business_name, claimed_at, status, profiles!listings_owner_id_fkey(full_name, email)").eq("status", "claimed_pending").order("claimed_at", { ascending: false }).limit(10),
        admin.from("notifications").select("id, type, title, message, created_at, data").in("type", [
            "new_listing_submitted", "new_payment_uploaded", "new_claim_request",
            "listing_approved", "listing_rejected", "annual_check_flagged", "annual_check_no_response",
        ]).order("created_at", { ascending: false }).limit(20),
        admin.from("listing_analytics").select("listing_id").eq("event_type", "page_view").gte("created_at", startOfMonth).limit(5000),
        admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "pending").lte("response_deadline", nextWeek).gte("response_deadline", now.toISOString().split("T")[0]),
        admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "no_response"),
    ]);

    const sumAmount = (rows: { amount: number }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);

    const thisMonthRevenue = sumAmount(revenueThisMonth as any);
    const lastMonthRevenue = sumAmount(revenueLastMonth as any);
    const allTimeRevenue_ = sumAmount(allTimeRevenue as any);

    const breakdown = { subscriptions: 0, ad_placements: 0, top_search: 0, reactivation_fees: 0 };
    (revenueThisMonth ?? []).forEach((p: any) => {
        const plan: string = p.plan_type ?? "";
        if (plan.includes("ad")) breakdown.ad_placements += Number(p.amount);
        else if (plan.includes("top_search")) breakdown.top_search += Number(p.amount);
        else if (plan.includes("reactivation")) breakdown.reactivation_fees += Number(p.amount);
        else breakdown.subscriptions += Number(p.amount);
    });

    const viewCountMap: Record<string, number> = {};
    (topListingAnalytics ?? []).forEach((r: any) => {
        viewCountMap[r.listing_id] = (viewCountMap[r.listing_id] || 0) + 1;
    });
    const topListingIds = Object.entries(viewCountMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

    let topListings: any[] = [];
    if (topListingIds.length > 0) {
        const { data: listingInfo } = await admin
            .from("listings")
            .select("id, slug, business_name, is_premium, is_featured, categories!listings_category_id_fkey(name)")
            .in("id", topListingIds);

        topListings = topListingIds.map((id, i) => {
            const info = (listingInfo ?? []).find((l: any) => l.id === id);
            return {
                rank: i + 1,
                id,
                slug: info?.slug ?? "",
                business_name: info?.business_name ?? "Unknown",
                category_name: (info?.categories as any)?.name ?? "-",
                views: viewCountMap[id] ?? 0,
                clicks: 0,
                plan: info?.is_premium ? "premium" : info?.is_featured ? "featured" : "free",
            };
        });
    }

    const pendingListingItems = (pendingListingRows ?? []).map((l: any) => ({
        id: l.id,
        name: l.business_name,
        owner: l.profiles?.full_name ?? "Unknown",
        date: l.created_at,
        status: l.status,
        reviewHref: `/admin/listings/${l.id}`,
    }));

    const pendingPaymentItems = (pendingPaymentRows ?? []).map((p: any) => ({
        id: p.id,
        name: p.description ?? `PHP ${p.amount}`,
        owner: p.profiles?.full_name ?? p.profiles?.email ?? "Unknown",
        date: p.created_at,
        status: p.status,
        reviewHref: `/admin/payments/${p.id}`,
    }));

    const pendingClaimItems = (pendingClaimRows ?? []).map((l: any) => ({
        id: l.id,
        name: l.business_name,
        owner: l.profiles?.full_name ?? l.profiles?.email ?? "Unknown",
        date: l.claimed_at ?? l.created_at,
        status: "claimed_pending",
        reviewHref: `/admin/claims/${l.id}`,
    }));

    return (
        <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <ActivityFeed activities={(activities ?? []) as any} />
                </div>
                <div className="lg:col-span-2">
                    <PendingItems
                        listings={pendingListingItems}
                        payments={pendingPaymentItems}
                        claims={pendingClaimItems}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <RevenueOverview
                        thisMonth={thisMonthRevenue}
                        lastMonth={lastMonthRevenue}
                        allTime={allTimeRevenue_}
                        breakdown={[
                            { label: "Subscriptions", amount: breakdown.subscriptions, color: "bg-blue-500" },
                            { label: "Ad Placements", amount: breakdown.ad_placements, color: "bg-purple-500" },
                            { label: "Featured", amount: breakdown.top_search, color: "bg-[#FF6B35]" },
                            { label: "Reactivation Fees", amount: breakdown.reactivation_fees, color: "bg-emerald-500" },
                        ]}
                    />
                </div>
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <AnnualChecksStatus
                        dueThisWeek={annualChecksDue ?? 0}
                        noResponse={annualChecksNoResponse ?? 0}
                    />
                </div>
            </div>

            <TopListings listings={topListings} />
        </>
    );
}
