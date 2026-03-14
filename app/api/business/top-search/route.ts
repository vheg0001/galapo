import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { resolveEqMutation } from "@/lib/supabase-query-utils";
import { 
    createPendingPaymentRecord,
    ensureOwnedListing,
    getTopSearchAvailability,
    getLowestAvailablePosition,
    getTopSearchPricingAndInstructions,
    fetchCategoriesMap,
    calculateFutureBillingPeriod
} from "@/lib/subscription-route-helpers";

/**
 * GET /api/business/top-search
 * Fetch top search placements for the authenticated user.
 */
export async function GET(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const { data: placements, error } = await admin
            .from("top_search_placements")
            .select("*, listings(business_name, slug)")
            .eq("listing_id", (
                admin.from("listings").select("id").eq("owner_id", profile.id)
            )); // Subquery for listings owned by user

        // Alternative if subquery above fails in some Supabase versions:
        // const { data: myListings } = await admin.from("listings").select("id").eq("owner_id", profile.id);
        // const ids = myListings?.map(l => l.id) || [];
        // query = admin.from("top_search_placements").select("*").in("listing_id", ids);

        if (error) throw error;

        // Fetch categories for mapping
        const categoryIds = (placements || []).map(p => p.category_id);
        const categoriesMap = await fetchCategoriesMap(categoryIds);

        const structured = (placements || []).map(p => ({
            ...p,
            listing_name: (p.listings as any)?.business_name || "Unknown Listing",
            category_name: categoriesMap[p.category_id]?.name || "Unknown Category"
        }));

        return NextResponse.json(structured);
    } catch (error: any) {
        console.error("GET /api/business/top-search error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/business/top-search
 * Purchase a new top search placement.
 */
export async function POST(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    try {
        const body = await request.json();
        const { listing_id, category_id, subcategory_id } = body as { 
            listing_id: string, 
            category_id: string, 
            subcategory_id?: string 
        };

        if (!listing_id || !category_id) {
            return NextResponse.json({ error: "Missing listing_id or category_id" }, { status: 400 });
        }

        const admin = createAdminSupabaseClient();

        // 1. Validate listing belongs to user
        const listing = await ensureOwnedListing(profile.id, listing_id);

        // 2. Check availability
        const availability = await getTopSearchAvailability(category_id);
        const position = getLowestAvailablePosition(availability);

        if (position === null) {
            return NextResponse.json({ 
                error: `All positions taken for the ${availability.category_name} category.` 
            }, { status: 409 });
        }

        // 3. Get pricing and instructions
        const { amount, paymentInstructions } = await getTopSearchPricingAndInstructions();

        // 4. Calculate initial period (can be adjusted by admin upon verification)
        const period = calculateFutureBillingPeriod();

        // 5. Check for existing pending placement and payment
        const { data: existingPlacement } = await admin
            .from("top_search_placements")
            .select("*")
            .eq("listing_id", listing_id)
            .eq("category_id", category_id)
            .eq("is_active", false)
            .single();

        if (existingPlacement) {
            const { data: existingPayment } = await admin
                .from("payments")
                .select("*")
                .eq("id", existingPlacement.payment_id)
                .eq("status", "pending")
                .is("payment_proof_url", "")
                .single();

            if (existingPayment) {
                return NextResponse.json({
                    placement: existingPlacement,
                    payment: existingPayment,
                    payment_instructions: paymentInstructions
                });
            }
        }

        // 6. Create payment record if no existing one found
        const payment = await createPendingPaymentRecord({
            subscriptionId: null,
            listingId: listing_id,
            userId: profile.id,
            amount,
            description: `Top Search Placement (Pos #${position}) for ${listing.business_name} in ${availability.category_name}`,
        });

        // 7. Create placement (pending payment) linked to the payment
        const { data: placement, error: placeError } = await admin
            .from("top_search_placements")
            .insert({
                listing_id,
                category_id,
                subcategory_id: subcategory_id || null,
                position,
                is_active: false,
                start_date: period.start,
                end_date: period.end,
                payment_id: payment.id,
            })
            .select("*")
            .single();

        if (placeError) throw placeError;

        const responsePlacement = {
            ...placement,
            listing_id,
            category_id,
            subcategory_id: subcategory_id || null,
            position,
            payment_id: payment.id,
        };

        return NextResponse.json({
            placement: responsePlacement,
            payment,
            payment_instructions: paymentInstructions
        });

    } catch (error: any) {
        if (error.status) return NextResponse.json({ error: error.message }, { status: error.status });
        console.error("POST /api/business/top-search error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
