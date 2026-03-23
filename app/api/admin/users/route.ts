import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
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
    const sort = searchParams.get("sort") ?? "created_at";
    const dir = searchParams.get("dir") ?? "desc";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    const allowedSorts = ["full_name", "email", "created_at"];
    const safeSort = allowedSorts.includes(sort) ? sort : "created_at";
    const ascending = dir === "asc";

    try {
        const admin = createAdminSupabaseClient();

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

        query = query.range(offset, offset + limit - 1);

        const { data: profiles, error, count } = await query;
        if (error) throw error;

        // Enrich with listing count and subscription status
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
        const { data: subs } = listingIds.length
            ? await admin
                .from("subscriptions")
                .select("listing_id, status, plan_type, created_at")
                .in("listing_id", listingIds)
                .eq("status", "active")
                .order("created_at", { ascending: false })
            : { data: [] };

        const countMap: Record<string, number> = {};
        (listingRows ?? []).forEach((l: any) => {
            countMap[l.owner_id] = (countMap[l.owner_id] ?? 0) + 1;
        });

        const subMap: Record<string, { status: string; plan_type: string; created_at?: string | null }> = {};
        (subs ?? []).forEach((s: any) => {
            const ownerId = listingIdToOwnerId.get(s.listing_id);
            if (!ownerId) return;

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

        const users = (profiles ?? []).map((p: any) => ({
            ...p,
            listing_count: countMap[p.id] ?? 0,
            subscription_status: subMap[p.id]?.status ?? null,
            subscription_plan: subMap[p.id]?.plan_type ?? null,
        }));

        return NextResponse.json({ users, total: count ?? 0, page, limit });
    } catch (err: any) {
        console.error("[admin/users GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
