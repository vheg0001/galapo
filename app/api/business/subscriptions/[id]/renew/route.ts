import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { 
    createPendingPaymentRecord,
    getSubscriptionPricingAndInstructions,
} from "@/lib/subscription-route-helpers";

/**
 * POST /api/business/subscriptions/[id]/renew
 * Initiate renewal for an expiring subscription.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const { id } = await params;
        // 1. Fetch current subscription and check ownership
        const { data: subscription, error: subError } = await admin
            .from("subscriptions")
            .select("*, listings(business_name, owner_id)")
            .eq("id", id)
            .single();

        if (subError) throw subError;
        if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

        const ownerId = (subscription.listings as any)?.owner_id;
        if (ownerId !== profile.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Determine renewal price and instructions
        const { amount, paymentInstructions } = await getSubscriptionPricingAndInstructions(subscription.plan_type);

        // 3. Return instructions (DO NOT create payment yet)
        return NextResponse.json({
            payment: null,
            subscription_id: subscription.id,
            payment_instructions: paymentInstructions
        });

    } catch (error: any) {
        console.error("POST /api/business/subscriptions/[id]/renew error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
