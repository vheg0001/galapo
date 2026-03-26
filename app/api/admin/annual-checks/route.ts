import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "all"; // due|pending|no_response|confirmed|deactivated|all
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    try {
        const admin = createAdminSupabaseClient();
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        let checks: any[] = [];
        let total = 0;

        // ─── Case: DUE ───
        if (status === "due") {
            // Find listings verified > 1 year ago and active
            let dueQuery = admin.from("listings").select(`
                id, business_name, slug, is_active, last_verified_at, category_id,
                profiles!listings_owner_id_fkey(id, full_name, email)
            `, { count: "exact" })
            .is("is_active", true)
            .lt("last_verified_at", oneYearAgo);

            if (category) dueQuery = dueQuery.eq("category_id", category);
            if (search) dueQuery = dueQuery.ilike("business_name", `%${search}%`);

            // Apply pagination on due listings
            dueQuery = dueQuery.range(offset, offset + limit - 1);
            
            const { data: listingsData, count: listCount, error: err } = await dueQuery;
            if (err) throw err;

            // Filter out listings that already have an active 'pending' check
            const listingIds = (listingsData ?? []).map(l => l.id);
            const { data: activeChecks } = listingIds.length 
                ? await admin.from("annual_checks").select("listing_id").in("listing_id", listingIds).eq("status", "pending")
                : { data: [] };
            
            const checksSet = new Set((activeChecks ?? []).map(c => c.listing_id));
            
            checks = (listingsData ?? []).filter(l => !checksSet.has(l.id)).map(l => ({
                id: `due-${l.id}`,
                status: "due",
                listing: l,
                owner: l.profiles ?? null,
                response_deadline: null,
                check_date: null,
                notes: null,
            }));
            
            // Note: Total isn't perfectly exact due to JS filtering, but acceptable for this UI constraint
            total = (listCount ?? 0) - checksSet.size;
        } 
        // ─── Case: Regular Annual Checks (pending, no_response, confirmed, deactivated, all) ───
        else {
            let query = admin
                .from("annual_checks")
                .select(`
                    id, listing_id, status, check_date, response_deadline, responded_at, created_at,
                    mylisting:listings!annual_checks_listing_id_fkey(
                        id, business_name, slug, is_active, last_verified_at, category_id, owner_id
                    )
                `, { count: "exact" })
                .order("created_at", { ascending: false });

            // Apply filters
            if (status === "pending") {
                query = query.eq("status", "pending").gte("response_deadline", now.toISOString());
            } else if (status === "no_response") {
                query = query.eq("status", "pending").lt("response_deadline", now.toISOString());
            } else if (status === "confirmed" || status === "deactivated") {
                query = query.eq("status", status);
            }

            if (category) {
                query = query.eq("mylisting.category_id", category);
            }

            if (search) {
                query = query.or(`business_name.ilike.%${search}%`, { foreignTable: "mylisting" });
            }

            query = query.range(offset, offset + limit - 1);

            const { data: checksData, count, error } = await query;
            if (error) throw error;

            total = count ?? 0;

            // Fetch profile data manually since we used inner join on listings
            const ownerIds = (checksData ?? []).map(c => (c.mylisting as any)?.owner_id).filter(Boolean);
            const { data: profiles } = ownerIds.length 
                ? await admin.from("profiles").select("id, full_name, email").in("id", ownerIds)
                : { data: [] };
            const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

            checks = (checksData ?? []).map((c: any) => ({
                id: c.id,
                status: c.status === "pending" && new Date(c.response_deadline) < now ? "no_response" : c.status,
                check_date: c.check_date,
                response_deadline: c.response_deadline,
                responded_at: c.responded_at,
                listing: c.mylisting ? {
                    id: c.mylisting.id,
                    business_name: c.mylisting.business_name,
                    slug: c.mylisting.slug,
                    is_active: c.mylisting.is_active,
                    last_verified_at: c.mylisting.last_verified_at,
                    category_id: (c.mylisting as any).category_id,
                } : null,
                owner: profileMap.get(c.mylisting?.owner_id) ?? null,
            }));
        }

        // ─── History Counts for displayed checks ───
        const listingIdsForHistory = checks.map(c => c.listing?.id).filter(Boolean);
        if (listingIdsForHistory.length > 0) {
            const { data: historyData } = await admin.from("annual_checks").select("listing_id").in("listing_id", listingIdsForHistory);
            const historyCountMap = new Map();
            (historyData ?? []).forEach(h => {
                historyCountMap.set(h.listing_id, (historyCountMap.get(h.listing_id) ?? 0) + 1);
            });
            checks.forEach(c => {
                if (c.listing) {
                    c.check_history_count = historyCountMap.get(c.listing.id) ?? 0;
                }
            });
        }

        // ─── Stats Calculation ───
        const [
            { count: pendingCountVal },
            { count: overdueCountVal },
            { count: confirmedMonthCountVal }
        ] = await Promise.all([
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "pending"),
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "pending").lt("response_deadline", now.toISOString()),
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("responded_at", startOfMonth)
        ]);

        return NextResponse.json({
            data: checks,
            pagination: { total, page, limit },
            stats: {
                pending_response: pendingCountVal ?? 0,
                no_response: overdueCountVal ?? 0,
                confirmed_this_month: confirmedMonthCountVal ?? 0
            }
        });
    } catch (err: any) {
        console.error("[admin/annual-checks GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
