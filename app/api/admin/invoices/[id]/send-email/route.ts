import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateInvoiceHTML } from "@/lib/invoice-helpers";

/**
 * POST /api/admin/invoices/[id]/send-email
 * Re-send invoice to business owner's email.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin(request);
        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        // 1. Fetch invoice with context
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

        // 2. Format data for HTML generator
        const invoiceData = {
            invoiceNumber: invoice.invoice_number,
            issueDate: invoice.issued_at,
            dueDate: invoice.due_date,
            status: invoice.status,
            businessName: invoice.listings.business_name,
            ownerName: invoice.profiles.full_name || invoice.profiles.email,
            ownerEmail: invoice.profiles.email,
            items: invoice.items,
            subtotal: invoice.amount,
            total: invoice.amount,
            paymentMethod: invoice.payments.payment_method,
            referenceNumber: invoice.payments.reference_number
        };

        const html = generateInvoiceHTML(invoiceData);

        // 3. TODO: Send via Resend
        console.log(`Sending invoice ${invoice.invoice_number} to ${invoice.profiles.email}`);

        return NextResponse.json({ success: true, message: "Invoice email queued" });

    } catch (error: any) {
        console.error("POST /api/admin/invoices/[id]/send-email error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
