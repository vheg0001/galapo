import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { 
    buildSubscriptionListItems, 
    createPendingPaymentRecord,
    fetchCategoriesMap, 
    ensureOwnedListing,
    calculateFutureBillingPeriod,
    getSubscriptionPricingAndInstructions,
    assertPlanUpgrade
} from "@/lib/subscription-route-helpers";
import { deriveActualPlan } from "@/lib/subscription-route-helpers";
import type { PlanTier } from "@/lib/types";

/**
 * GET /api/business/subscriptions
 * Fetch all subscriptions and listings for the authenticated business owner.
 */
export async function GET(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        // 1. Fetch all listings owned by the user
        const { data: listings, error: listingsError } = await admin
            .from("listings")
            .select("id, business_name, status, is_featured, is_premium, category_id, subcategory_id")
            .eq("owner_id", profile.id);

        if (listingsError) throw listingsError;
        if (!listings || listings.length === 0) {
            return NextResponse.json([]);
        }

        const listingIds = listings.map(l => l.id);

        // 2. Fetch subscriptions, placements, and payments
        const [
            { data: subscriptions },
            { data: placements },
            { data: payments }
        ] = await Promise.all([
            admin.from("subscriptions").select("*").in("listing_id", listingIds),
            admin.from("top_search_placements").select("*").in("listing_id", listingIds),
            admin.from("payments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false })
        ]);

        // 3. Fetch categories for names
        const categoryIds = [
            ...listings.map(l => l.category_id),
            ...listings.map(l => l.subcategory_id),
            ...(placements ?? []).map(p => p.category_id)
        ];
        const categoriesMap = await fetchCategoriesMap(categoryIds);

        // 4. Transform into structured response
        const items = buildSubscriptionListItems({
            listings,
            subscriptions: subscriptions ?? [],
            placements: placements ?? [],
            payments: payments ?? [],
            categories: categoriesMap
        });

        return NextResponse.json(items);
    } catch (error: any) {
        console.error("GET /api/business/subscriptions error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/business/subscriptions
 * Initiate a new subscription (upgrade).
 */
export async function POST(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    try {
        const body = await request.json();
        const { listing_id, plan_type } = body as { listing_id: string, plan_type: PlanTier };

        if (!listing_id || !plan_type || plan_type === "free") {
            return NextResponse.json({ error: "Missing listing_id or invalid plan_type" }, { status: 400 });
        }

        const admin = createAdminSupabaseClient();

        // 1. Validate listing belongs to user
        const listing = await ensureOwnedListing(profile.id, listing_id);

        // 2. Check if listing already has active subscription of same or higher tier
        const currentPlan = deriveActualPlan(listing);
        assertPlanUpgrade(currentPlan, plan_type);

        // 3. Calculate amount and get instructions
        const { amount, paymentInstructions } = await getSubscriptionPricingAndInstructions(plan_type as Exclude<PlanTier, "free">);

        // 4. Check for existing pending subscription and payment
        const { data: existingSub } = await admin
            .from("subscriptions")
            .select("id, amount, status")
            .eq("listing_id", listing_id)
            .eq("plan_type", plan_type)
            .eq("status", "pending_payment")
            .single();

        if (existingSub) {
            const { data: existingPayment } = await admin
                .from("payments")
                .select("*")
                .eq("subscription_id", existingSub.id)
                .eq("status", "pending")
                .is("payment_proof_url", "")
                .single();

            if (existingPayment) {
                return NextResponse.json({
                    subscription: existingSub,
                    payment: existingPayment,
                    payment_instructions: paymentInstructions
                });
            }
        }

        // 5. Create subscription record (pending) if no existing one found
        const period = calculateFutureBillingPeriod();
        const { data: subscription, error: subError } = await admin
            .from("subscriptions")
            .insert({
                listing_id,
                plan_type,
                status: "pending_payment",
                amount,
                start_date: period.start,
                end_date: period.end,
                auto_renew: true
            })
            .select("*")
            .single();

        if (subError) throw subError;

        // 6. Create payment record (pending)
        const payment = await createPendingPaymentRecord({
            subscriptionId: subscription.id,
            listingId: listing_id,
            userId: profile.id,
            amount,
            description: `Upgrade to ${plan_type.toUpperCase()} plan for ${listing.business_name}`,
        });

        return NextResponse.json({
            subscription,
            payment,
            payment_instructions: paymentInstructions
        });

    } catch (error: any) {
        if (error.status) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("POST /api/business/subscriptions error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
