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

        if (status === "rejected") {
            const { data, error, count } = await admin
                .from("notifications")
                .select(`
                    id, created_at, data,
                    profiles!notifications_user_id_fkey(id, full_name, email, avatar_url)
                `, { count: "exact" })
                .eq("type", "claim_rejected")
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return NextResponse.json({
                claims: (data ?? []).map((n: any) => ({
                    id: n.data?.listing_id ?? n.id,
                    notification_id: n.id,
                    listing_name: n.data?.listing_name ?? "Unknown",
                    slug: "",
                    status: "rejected",
                    claimed_at: n.created_at,
                    proof_url: n.data?.proof_url ?? n.data?.claim_proof_url ?? null,
                    claimant: n.profiles ?? null,
                    is_pre_populated: false,
                })),
                total: count ?? 0,
                page,
                limit,
            });
        }

        let query = admin
            .from("listings")
            .select(`
                id, business_name, slug, status, claimed_at, claim_proof_url,
                created_at, is_pre_populated,
                profiles!listings_owner_id_fkey(id, full_name, email, avatar_url)
            `, { count: "exact" })
            .order("claimed_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status === "pending" || status === "all") {
            query = query.eq("status", "claimed_pending");
        } else if (status === "approved") {
            query = query.eq("status", "approved").not("claimed_at", "is", null).not("owner_id", "is", null);
        }

        const { data, error, count } = await query;

        if (error) throw error;

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
