import { PlanType, Deal, DealStatus } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the maximum number of active deals allowed for a given plan type.
 */
export function getDealLimit(planType: PlanType): number {
    switch (planType) {
        case PlanType.PREMIUM:
            return 5;
        case PlanType.FEATURED:
            return 3;
        case PlanType.FREE:
        default:
            return 1;
    }
}

/**
 * Returns the number of currently active deals for a specific listing.
 */
export async function getActiveDealCount(supabase: SupabaseClient, listingId: string): Promise<number> {
    const today = new Date().toISOString();
    const { count, error } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId)
        .eq("is_active", true)
        .gte("end_date", today);

    if (error) {
        console.error("[getActiveDealCount]", error);
        return 0;
    }

    return count || 0;
}

/**
 * Checks if a business owner can create a new deal for a listing.
 */
export async function canCreateDeal(
    supabase: SupabaseClient,
    listingId: string,
    userId: string,
    role?: string
): Promise<{ allowed: boolean; reason?: string; limit: number; used: number; plan: PlanType }> {
    // 1. Verify listing ownership and plan
    const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("id, owner_id, is_premium, is_featured, status, is_active")
        .eq("id", listingId)
        .single();

    if (listingError || !listing) {
        return { allowed: false, reason: "Listing not found", limit: 0, used: 0, plan: PlanType.FREE };
    }

    if (listing.owner_id !== userId && role !== "super_admin") {
        return { allowed: false, reason: "You do not own this listing", limit: 0, used: 0, plan: PlanType.FREE };
    }

    if (listing.status !== "approved" || !listing.is_active) {
        return { allowed: false, reason: "Listing must be approved and active to post deals", limit: 0, used: 0, plan: PlanType.FREE };
    }

    // 2. Determine plan and limit
    let plan = PlanType.FREE;
    if (listing.is_premium) plan = PlanType.PREMIUM;
    else if (listing.is_featured) plan = PlanType.FEATURED;

    const limit = getDealLimit(plan);
    const used = await getActiveDealCount(supabase, listingId);

    if (used >= limit) {
        return { allowed: false, reason: "Deal limit reached. Upgrade your plan for more slots.", limit, used, plan };
    }

    return { allowed: true, limit, used, plan };
}

/**
 * Checks if a deal is currently active based on its flags and dates.
 */
export function isDealActive(deal: Deal): boolean {
    if (!deal.is_active) return false;
    const now = new Date();
    const start = new Date(deal.start_date);
    const end = new Date(deal.end_date);
    return now >= start && now <= end;
}

/**
 * Returns the status string for a deal.
 */
export function getDealStatus(deal: Deal): DealStatus {
    if (!deal.is_active) return "inactive";
    const now = new Date();
    const start = new Date(deal.start_date);
    const end = new Date(deal.end_date);

    if (now < start) return "scheduled";
    if (now > end) return "expired";
    return "active";
}

/**
 * Formats a date string for expiry display.
 */
export function formatExpiryText(endDate: string): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `Ends in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;

    return "Ends very soon";
}
