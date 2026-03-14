import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();

        const [
            { data: pendingListings },
            { data: pendingPayments },
            { data: pendingClaims },
        ] = await Promise.all([
            admin
                .from("listings")
                .select("id, business_name, created_at, profiles!listings_owner_id_fkey(full_name)")
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(5),

            admin
                .from("payments")
                .select("id, amount, description, created_at, profiles!payments_user_id_fkey(full_name)")
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(5),

            admin
                .from("listings")
                .select("id, business_name, claimed_at, profiles!listings_owner_id_fkey(full_name)")
                .eq("status", "claimed_pending")
                .order("claimed_at", { ascending: false })
                .limit(5),
        ]);

        return NextResponse.json({
            pending_listings: (pendingListings ?? []).map((l: any) => ({
                id: l.id,
                business_name: l.business_name,
                owner_name: l.profiles?.full_name ?? "Unknown",
                submitted_at: l.created_at,
            })),
            pending_payments: (pendingPayments ?? []).map((p: any) => ({
                id: p.id,
                owner_name: p.profiles?.full_name ?? "Unknown",
                amount: p.amount,
                plan: p.description ?? "-",
                submitted_at: p.created_at,
            })),
            pending_claims: (pendingClaims ?? []).map((l: any) => ({
                id: l.id,
                listing_name: l.business_name,
                claimant_name: l.profiles?.full_name ?? "Unknown",
                submitted_at: l.claimed_at ?? l.created_at,
            })),
        });
    } catch (err: any) {
        console.error("[admin/dashboard/pending]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
