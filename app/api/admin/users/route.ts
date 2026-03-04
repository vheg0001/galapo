import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
        const [{ data: listingCounts }, { data: subs }] = await Promise.all([
            ids.length
                ? admin.from("listings").select("owner_id").in("owner_id", ids)
                : Promise.resolve({ data: [] }),
            ids.length
                ? admin.from("subscriptions").select("user_id, status, plan_type").in("user_id", ids).eq("status", "active")
                : Promise.resolve({ data: [] }),
        ]);

        const countMap: Record<string, number> = {};
        (listingCounts ?? []).forEach((l: any) => {
            countMap[l.owner_id] = (countMap[l.owner_id] ?? 0) + 1;
        });

        const subMap: Record<string, { status: string; plan_type: string }> = {};
        (subs ?? []).forEach((s: any) => {
            subMap[s.user_id] = { status: s.status, plan_type: s.plan_type };
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
