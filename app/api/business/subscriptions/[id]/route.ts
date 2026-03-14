import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { resolveEqMutation } from "@/lib/supabase-query-utils";
import type { PlanTier } from "@/lib/types";

/**
 * GET /api/business/subscriptions/[id]
 * Fetch a single subscription detail.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const { id } = await params;
        const { data: subscription, error } = await admin
            .from("subscriptions")
            .select("*, listings(business_name, owner_id)")
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

        // Security check: Ensure owner matches user
        const ownerId = (subscription.listings as any)?.owner_id;
        if (ownerId !== profile.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(subscription);
    } catch (error: any) {
        console.error("GET /api/business/subscriptions/[id] error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PUT /api/business/subscriptions/[id]
 * Update subscription (cancel_auto_renew, request_downgrade).
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const { id } = await params;
        const body = await request.json();
        const { action, target_plan } = body as { 
            action: "cancel_auto_renew" | "request_downgrade", 
            target_plan?: PlanTier 
        };

        // 1. Fetch subscription and check ownership
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

        if (action === "cancel_auto_renew") {
            // Cancel auto-renewal
            const updateQuery = admin
                .from("subscriptions")
                .update({ auto_renew: false });
            const { error: updateError } = await resolveEqMutation(updateQuery, "id", id);

            if (updateError) throw updateError;
            return NextResponse.json({ message: "Auto-renewal cancelled successfully" });

        } else if (action === "request_downgrade") {
            if (!target_plan) return NextResponse.json({ error: "target_plan is required for downgrade" }, { status: 400 });

            // Create a downgrade request to be processed at next billing cycle
            const { error: requestError } = await admin
                .from("subscription_change_requests")
                .insert({
                    subscription_id: id,
                    listing_id: subscription.listing_id,
                    action: "request_downgrade",
                    current_plan: subscription.plan_type,
                    target_plan: target_plan,
                    effective_date: subscription.end_date,
                    status: "pending",
                    requested_by: profile.id
                });

            if (requestError) throw requestError;
            return NextResponse.json({ message: "Downgrade request scheduled successfully" });

        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("PUT /api/business/subscriptions/[id] error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
