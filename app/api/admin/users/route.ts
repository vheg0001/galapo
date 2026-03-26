import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PLAN_PRIORITY: Record<string, number> = {
    free: 0,
    featured: 1,
    premium: 2,
};

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";  // "active" | "inactive" | ""
    const hasSubscription = searchParams.get("has_subscription"); // "true" | "false"
    const hasListings = searchParams.get("has_listings"); // "true" | "false"
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    
    // sorting
    const sort_by = searchParams.get("sort_by") ?? searchParams.get("sort") ?? "created_at";
    const sort_order = searchParams.get("sort_order") ?? searchParams.get("dir") ?? "desc";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    const allowedSorts = ["full_name", "email", "created_at"];
    const safeSort = allowedSorts.includes(sort_by) ? sort_by : "created_at";
    const ascending = sort_order === "asc";

    try {
        const admin = createAdminSupabaseClient();
        
        let validIds: string[] | null = null;
        
        // If we need to filter by listing or subscription presence, we must pre-calculate owners
        if (hasListings || hasSubscription) {
            const { data: allListings } = await admin.from("listings").select("id, owner_id");
            const ownersWithListings = new Set((allListings || []).map(l => l.owner_id).filter(Boolean));
            
            const listingIds = (allListings || []).map(l => l.id).filter(Boolean);
            const { data: allSubs } = listingIds.length ? await admin.from("subscriptions").select("listing_id, status").in("listing_id", listingIds).eq("status", "active") : { data: [] };
            
            const ownerToHasSub = new Set();
            (allSubs || []).forEach(sub => {
                const l = (allListings || []).find(l => l.id === sub.listing_id);
                if (l && l.owner_id) ownerToHasSub.add(l.owner_id);
            });
            
            const { data: allOwners } = await admin.from("profiles").select("id").eq("role", "business_owner");
            
            validIds = (allOwners || []).map(o => o.id).filter(id => {
                let pass = true;
                if (hasListings === "true") pass = pass && ownersWithListings.has(id);
                if (hasListings === "false") pass = pass && !ownersWithListings.has(id);
                if (hasSubscription === "true") pass = pass && ownerToHasSub.has(id);
                if (hasSubscription === "false") pass = pass && !ownerToHasSub.has(id);
                return pass;
            });
            
            if (validIds && validIds.length === 0) validIds = ["00000000-0000-0000-0000-000000000000"]; // empty set
        }

        let query = admin
            .from("profiles")
            .select("id, full_name, email, phone, is_active, created_at, avatar_url", { count: "exact" })
            .eq("role", "business_owner")
            .order(safeSort as any, { ascending });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (status === "active") query = query.eq("is_active", true);
        if (status === "inactive") query = query.eq("is_active", false);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo);
        if (validIds) query = query.in("id", validIds);

        query = query.range(offset, offset + limit - 1);

        const { data: profiles, error, count } = await query;
        if (error) throw error;

        // Enrich with listing count, active subscriptions, total payments, last activity
        const ids = (profiles ?? []).map((p: any) => p.id);
        const { data: listingRows } = ids.length
            ? await admin.from("listings").select("id, owner_id").in("owner_id", ids)
            : { data: [] };

        const listingIdToOwnerId = new Map<string, string>();
        (listingRows ?? []).forEach((listing: any) => {
            if (listing.id && listing.owner_id) {
                listingIdToOwnerId.set(listing.id, listing.owner_id);
            }
        });

        const listingIds = Array.from(listingIdToOwnerId.keys());
        
        const [
            { data: subs },
            { data: payments },
            { data: analytics }
        ] = await Promise.all([
            listingIds.length
                ? admin.from("subscriptions").select("listing_id, status, plan_type, created_at").in("listing_id", listingIds).eq("status", "active").order("created_at", { ascending: false })
                : Promise.resolve({ data: [] }),
            ids.length
                ? admin.from("payments").select("user_id, amount").in("user_id", ids).eq("status", "verified")
                : Promise.resolve({ data: [] }),
            listingIds.length
                ? admin.from("listing_analytics").select("listing_id, created_at").in("listing_id", listingIds).order("created_at", { ascending: false })
                : Promise.resolve({ data: [] })
        ]);

        const countMap: Record<string, number> = {};
        (listingRows ?? []).forEach((l: any) => {
            countMap[l.owner_id] = (countMap[l.owner_id] ?? 0) + 1;
        });

        // total payments logic
        const paymentMap: Record<string, number> = {};
        (payments ?? []).forEach((p: any) => {
            paymentMap[p.user_id] = (paymentMap[p.user_id] ?? 0) + (Number(p.amount) || 0);
        });

        // activity map
        const activityMap: Record<string, string> = {};
        (analytics ?? []).forEach((a: any) => {
            const ownerId = listingIdToOwnerId.get(a.listing_id);
            if (ownerId && !activityMap[ownerId]) {
                activityMap[ownerId] = a.created_at; // since it's ordered descending it gets the latest
            }
        });

        const subCountMap: Record<string, number> = {};
        const subMap: Record<string, { status: string; plan_type: string; created_at?: string | null }> = {};
        (subs ?? []).forEach((s: any) => {
            const ownerId = listingIdToOwnerId.get(s.listing_id);
            if (!ownerId) return;

            subCountMap[ownerId] = (subCountMap[ownerId] || 0) + 1;

            const existing = subMap[ownerId];
            const nextPriority = PLAN_PRIORITY[String(s.plan_type)] ?? -1;
            const existingPriority = existing ? PLAN_PRIORITY[String(existing.plan_type)] ?? -1 : -1;
            const shouldReplace =
                !existing ||
                nextPriority > existingPriority ||
                (nextPriority === existingPriority &&
                    new Date(String(s.created_at ?? 0)).getTime() > new Date(String(existing.created_at ?? 0)).getTime());

            if (shouldReplace) {
                subMap[ownerId] = {
                    status: s.status,
                    plan_type: s.plan_type,
                    created_at: s.created_at,
                };
            }
        });

        const data = (profiles ?? []).map((p: any) => ({
            ...p,
            listing_count: countMap[p.id] ?? 0,
            active_subscriptions: subCountMap[p.id] ?? 0,
            total_payments: paymentMap[p.id] ?? 0,
            last_activity: activityMap[p.id] || p.created_at,
            subscription_status: subMap[p.id]?.status ?? null,
            subscription_plan: subMap[p.id]?.plan_type ?? null,
        }));

        // ─── Stats Calculation ───
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [
            { count: totalCount },
            { count: monthCount },
            { count: activeSubsCount },
            { count: pendingListingsCount }
        ] = await Promise.all([
            admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "business_owner"),
            admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "business_owner").gte("created_at", startOfMonth),
            admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
            admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending")
        ]);

        return NextResponse.json({ 
            data, 
            pagination: { total: count ?? 0, page, limit },
            stats: {
                total: totalCount ?? 0,
                this_month: monthCount ?? 0,
                with_subscriptions: activeSubsCount ?? 0,
                with_pending: pendingListingsCount ?? 0
            }
        });

    } catch (err: any) {
        console.error("[admin/users GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
