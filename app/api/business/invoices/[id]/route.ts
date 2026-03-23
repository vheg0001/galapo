import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/business/invoices/[id]
 * Fetch single invoice for authenticated owner.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireBusinessOwner(request);
        if ('error' in auth) return auth.error;

        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        const { data: invoice, error } = await supabase
            .from("invoices")
            .select(`
                *,
                listings:listing_id (id, business_name, slug),
                payments:payment_id (id, payment_method, reference_number, status)
            `)
            .eq("id", id)
            .eq("user_id", auth.user.id)
            .single();

        if (error || !invoice) {
            return NextResponse.json({ error: "Invoice not found or access denied" }, { status: 404 });
        }

        return NextResponse.json(invoice);

    } catch (error: any) {
        console.error("GET /api/business/invoices/[id] error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
