import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    try {
        const admin = createAdminSupabaseClient();

        const { data, error, count } = await admin
            .from("listings")
            .select(`
                id, business_name, slug, status, claimed_at, claim_proof_url,
                created_at, is_pre_populated,
                profiles!listings_owner_id_fkey(id, full_name, email, avatar_url)
            `, { count: "exact" })
            .eq("status", status === "all" ? undefined : "claimed_pending" as any)
            .order("claimed_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // If status filter isn't "pending", adjust the query for other statuses like "approved"/"rejected"
        return NextResponse.json({
            claims: (data ?? []).map((l: any) => ({
                id: l.id,
                listing_name: l.business_name,
                slug: l.slug,
                status: l.status,
                claimed_at: l.claimed_at,
                proof_url: l.claim_proof_url,
                claimant: l.profiles ?? null,
                is_pre_populated: l.is_pre_populated,
            })),
            total: count ?? 0,
            page,
            limit,
        });
    } catch (err: any) {
        console.error("[admin/claims GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
