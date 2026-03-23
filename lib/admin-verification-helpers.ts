import { createAdminSupabaseClient } from "@/lib/supabase";
import { 
    PaymentStatus, 
    SubscriptionStatus, 
    NotificationType,
    PlanTier
} from "@/lib/types";
import { addDays } from "date-fns";
import { generateInvoiceNumber, formatInvoiceData } from "./invoice-helpers";
import { 
    activateSubscription, 
    activateTopSearch, 
    activateReactivation 
} from "./payment-helpers";

/**
 * verifyPaymentAndActivate
 * The core logic for verifying a payment and triggering all side effects.
 */
export async function verifyPaymentAndActivate(paymentId: string, adminId: string) {
    const supabase = createAdminSupabaseClient();

    // 1. Fetch payment with context
    const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select(`
            *,
            subscriptions:subscription_id (*),
            listings:listing_id (id, business_name, slug),
            profiles:user_id (id, full_name, email)
        `)
        .eq("id", paymentId)
        .single();

    if (fetchError || !payment) throw new Error("Payment not found");
    if (payment.status === PaymentStatus.VERIFIED) return { message: "Already verified" };

    const owner = payment.profiles;
    const listing = payment.listings;
    const now = new Date().toISOString();
    
    // 2a. Update Payment Status
    const { error: pError } = await supabase
        .from("payments")
        .update({
            status: PaymentStatus.VERIFIED,
            verified_by: adminId,
            verified_at: now
        })
        .eq("id", paymentId);
    if (pError) throw pError;

    // 2b. Handle Activations
    if (payment.subscription_id && payment.subscriptions) {
        await activateSubscription(
            supabase,
            payment.subscription_id,
            payment.id,
            payment.listing_id,
            payment.subscriptions.plan_type
        );
    } else if (payment.description.toLowerCase().includes("top search")) {
        await activateTopSearch(supabase, payment.id, payment.listing_id);
    } else if (payment.description.toLowerCase().includes("reactivation fee")) {
        await activateReactivation(supabase, payment.id, payment.listing_id);
    }

    // 3. Generate Invoice Record
    const invoiceNumber = await generateInvoiceNumber(supabase);
    const invoiceData = formatInvoiceData(payment, invoiceNumber, listing, owner);

    const { data: invoice, error: iError } = await supabase
        .from("invoices")
        .insert({
            payment_id: paymentId,
            listing_id: payment.listing_id,
            user_id: payment.user_id,
            invoice_number: invoiceNumber,
            amount: payment.amount,
            description: payment.description,
            items: invoiceData.items,
            issued_at: invoiceData.issueDate,
            due_date: invoiceData.dueDate,
            status: "paid"
        })
        .select()
        .single();
    
    if (iError) throw iError;

    // 4. Send Notifications
    await supabase.from("notifications").insert({
        user_id: payment.user_id,
        type: NotificationType.PAYMENT_CONFIRMED,
        title: "Payment Verified!",
        message: `Your payment for ${payment.description} has been verified. Your service is now active and an invoice (#${invoiceNumber}) has been generated.`,
        data: { payment_id: paymentId, invoice_id: invoice?.id }
    });

    // 5. TODO: Queue Email with Resend

    return { 
        success: true, 
        invoice_id: invoice?.id,
        invoice_number: invoiceNumber,
        message: "Payment verified and services activated successfully" 
    };
}

/**
 * rejectPayment
 */
export async function rejectPayment(paymentId: string, reason: string, adminId: string) {
    const supabase = createAdminSupabaseClient();

    const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select("user_id, description")
        .eq("id", paymentId)
        .single();

    if (fetchError || !payment) throw new Error("Payment not found");

    const { error: pError } = await supabase
        .from("payments")
        .update({
            status: PaymentStatus.REJECTED,
            rejection_reason: reason,
            verified_by: adminId,
            verified_at: new Date().toISOString()
        })
        .eq("id", paymentId);
    if (pError) throw pError;

    // Send Rejection Notification
    await supabase.from("notifications").insert({
        user_id: payment.user_id,
        type: NotificationType.PAYMENT_REJECTED,
        title: "Payment Rejected",
        message: `Your payment for ${payment.description} was rejected. Reason: ${reason}. Please re-upload your proof.`,
        data: { payment_id: paymentId, reason }
    });

    return { success: true, message: "Payment rejected and owner notified" };
}
