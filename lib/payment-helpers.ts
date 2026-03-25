import { createAdminSupabaseClient } from "./supabase";
import { 
    SubscriptionStatus, 
    PlanTier, 
    NotificationType 
} from "./types";
import { addDays } from "date-fns";

/**
 * getSignedProofUrl
 * Generates a signed URL for a private payment proof file.
 * Handles both raw paths and full Supabase storage URLs.
 */
export async function getSignedProofUrl(pathOrUrl: string): Promise<string> {
    const supabase = createAdminSupabaseClient();
    let filePath = pathOrUrl;

    // If it's a full URL, extract the path after the bucket name
    if (pathOrUrl.includes("/storage/v1/object/")) {
        try {
            const url = new URL(pathOrUrl);
            const parts = url.pathname.split("/payments/");
            if (parts.length > 1) {
                filePath = parts[1];
            }
        } catch (e) {
            // Fallback to original string if URL parsing fails
        }
    }

    const { data, error } = await supabase.storage
        .from("payments")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
        console.error("Error creating signed URL:", error.message);
        return pathOrUrl; // Fallback to original
    }
    
    return data.signedUrl;
}

/**
 * activateSubscription
 * Handles all steps for activating a paid subscription.
 */
export async function activateSubscription(
    supabase: any,
    subscriptionId: string,
    paymentId: string,
    listingId: string,
    planType: string
) {
    const now = new Date().toISOString();
    const startDate = now;
    const endDate = addDays(new Date(now), 30).toISOString();

    // 1. Update subscription status
    const { error: sError } = await supabase
        .from("subscriptions")
        .update({
            status: SubscriptionStatus.ACTIVE,
            start_date: startDate,
            end_date: endDate,
            updated_at: now
        })
        .eq("id", subscriptionId);
    if (sError) throw sError;

    // 2. Update listing flags
    const plan = planType.toLowerCase();
    const { error: lError } = await supabase
        .from("listings")
        .update({
            is_featured: plan === "featured" || plan === "premium",
            is_premium: plan === "premium",
            updated_at: now
        })
        .eq("id", listingId);
    if (lError) throw lError;

    // 3. Assign plan badge to listing_badges
    // First, remove old plan badges
    await supabase
        .from("listing_badges")
        .delete()
        .eq("listing_id", listingId)
        .in("badge_id", ["featured", "premium"]); // Assuming IDs match

    // Add new badge
    const badgeId = plan === "premium" ? "premium" : "featured";
    await supabase
        .from("listing_badges")
        .insert({
            listing_id: listingId,
            badge_id: badgeId,
            assigned_at: now
        });

    return { startDate, endDate };
}

/**
 * activateTopSearch
 * Activates a top search placement.
 */
export async function activateTopSearch(
    supabase: any,
    paymentId: string,
    listingId: string
) {
    const now = new Date().toISOString();
    const startDate = now;
    const endDate = addDays(new Date(now), 30).toISOString();

    const { error: tsError } = await supabase
        .from("top_search_placements")
        .update({
            is_active: true,
            start_date: startDate,
            end_date: endDate,
            updated_at: now
        })
        .eq("payment_id", paymentId);

    if (tsError) throw tsError;

    // Assign "Sponsored" badge to the listing array
    try {
        const { data: listing } = await supabase
            .from("listings")
            .select("badges")
            .eq("id", listingId)
            .single();
        
        const badges = Array.isArray(listing?.badges) ? listing.badges : [];
        if (!badges.includes("sponsored")) {
            await supabase
                .from("listings")
                .update({ badges: [...badges, "sponsored"] })
                .eq("id", listingId);
        }
    } catch (badgeErr) {
        // Don't throw, we still want the placement to be active
    }

    return { startDate, endDate };
}

/**
 * activateReactivation
 * Reactivates a deactivated listing.
 */
export async function activateReactivation(
    supabase: any,
    paymentId: string,
    listingId: string
) {
    const now = new Date().toISOString();

    // 1. Update reactivation fee status
    const { error: rfError } = await supabase
        .from("reactivation_fees")
        .update({
            status: "paid",
            updated_at: now
        })
        .eq("payment_id", paymentId);
    if (rfError) throw rfError;

    // 2. Reactivate listing
    const { error: lError } = await supabase
        .from("listings")
        .update({
            status: "approved",
            is_active: true,
            last_verified_at: now,
            updated_at: now
        })
        .eq("id", listingId);
    if (lError) throw lError;

    // 3. Create new annual check cycle (placeholder logic)
    // In a real app, this might insert a record into an annual_checks table
    
    return { reactivatedAt: now };
}
