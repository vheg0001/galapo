import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getSignedProofUrl } from "@/lib/payment-helpers";

/**
 * GET /api/admin/payments/[id]
 * Fetch full payment detail with context and signed proof URL.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin(request);
        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        // 1. Fetch payment with context
        const { data: payment, error: fetchError } = await supabase
            .from("payments")
            .select(`
                *,
                subscriptions:subscription_id (*),
                listings:listing_id (id, business_name, slug, category_id, status),
                profiles:user_id (*)
            `)
            .eq("id", id)
            .single();

        if (fetchError || !payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // 2. Generate signed URL for proof if it exists
        let signedProofUrl = null;
        if (payment.payment_proof_url) {
            // Extract file path from public URL or store it separately
            // Assuming the path is stored in payment_proof_url or we can derive it
            // For now, let's assume getSignedProofUrl can handle the full path if we extract it
            try {
                // In a production app, you'd store the bucket path, not the public URL
                // We'll extract the path from the URL if possible, or assume it's the path
                const url = new URL(payment.payment_proof_url);
                const pathParts = url.pathname.split("/storage/v1/object/public/payments/");
                if (pathParts.length > 1) {
                    signedProofUrl = await getSignedProofUrl(pathParts[1]);
                } else {
                    signedProofUrl = payment.payment_proof_url; // Fallback
                }
            } catch (e) {
                signedProofUrl = payment.payment_proof_url;
            }
        }

        // 3. Fetch recent payments for this user (last 5)
        const { data: recentPayments } = await supabase
            .from("payments")
            .select("*")
            .eq("user_id", payment.user_id)
            .neq("id", id)
            .order("created_at", { ascending: false })
            .limit(5);

        // 4. Enrich owner data (placeholders for total_payments, etc. - would need aggregation in real use)
        const owner = {
            ...payment.profiles,
            name: payment.profiles.full_name || payment.profiles.email,
            member_since: payment.profiles.created_at,
            total_payments: recentPayments?.length || 0,
            verified_rate: "100%" // Placeholder
        };

        return NextResponse.json({
            payment: { ...payment, signedProofUrl },
            owner,
            listing: payment.listings,
            subscription: payment.subscriptions,
            recent_payments: recentPayments || []
        });

    } catch (error: any) {
        console.error("GET /api/admin/payments/[id] error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
