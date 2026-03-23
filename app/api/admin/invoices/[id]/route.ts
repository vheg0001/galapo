import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/admin/invoices/[id]
 * Fetch single invoice with all details for rendering.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin(request);
        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        const { data: invoice, error } = await supabase
            .from("invoices")
            .select(`
                *,
                listings:listing_id (id, business_name, slug),
                profiles:user_id (id, full_name, email),
                payments:payment_id (*)
            `)
            .eq("id", id)
            .single();

        if (error || !invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json(invoice);

    } catch (error: any) {
        console.error("GET /api/admin/invoices/[id] error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
