import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    try {
        const admin = createAdminSupabaseClient();

        let query = admin
            .from("annual_checks")
            .select(`
                id, status, sent_at, response_deadline, responded_at, notes, created_at,
                listings!annual_checks_listing_id_fkey(
                    id, business_name, slug, is_active, last_verified_at,
                    profiles!listings_owner_id_fkey(id, full_name, email)
                )
            `, { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status);

        const { data, error, count } = await query;
        if (error) throw error;

        return NextResponse.json({
            checks: (data ?? []).map((c: any) => ({
                id: c.id,
                status: c.status,
                sent_at: c.sent_at,
                response_deadline: c.response_deadline,
                responded_at: c.responded_at,
                notes: c.notes,
                listing: c.listings ? {
                    id: c.listings.id,
                    business_name: c.listings.business_name,
                    slug: c.listings.slug,
                    is_active: c.listings.is_active,
                    last_verified_at: c.listings.last_verified_at,
                } : null,
                owner: c.listings?.profiles ?? null,
            })),
            total: count ?? 0,
            page,
            limit,
        });
    } catch (err: any) {
        console.error("[admin/annual-checks GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
