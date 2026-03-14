import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { PaginatedResponse, PaymentHistoryItem } from "@/lib/types";

/**
 * GET /api/business/payments
 * Fetch payment history for the authenticated business owner.
 */
export async function GET(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const admin = createAdminSupabaseClient();

    try {
        let query = admin
            .from("payments")
            .select(`
                *,
                listings(business_name, slug),
                subscriptions(id, plan_type, status),
                invoices(id, invoice_number, amount, status, issued_at)
            `, { count: "exact" })
            .eq("user_id", profile.id)
            .or('status.neq.pending,and(payment_proof_url.neq."",payment_proof_url.not.is.null)')
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        const response: PaginatedResponse<PaymentHistoryItem> = {
            data: (data || []).map(p => ({
                ...p,
                listing_name: (p.listings as any)?.business_name || "Unknown Listing",
                listing_slug: (p.listings as any)?.slug || null,
                subscription: p.subscriptions?.[0] || p.subscriptions || null, // handle possible array/single object
                invoice: p.invoices?.[0] || p.invoices || null
            })) as PaymentHistoryItem[],
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("GET /api/business/payments error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}