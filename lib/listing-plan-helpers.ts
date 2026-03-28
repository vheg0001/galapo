export type ListingPlanTier = "free" | "featured" | "premium";

export function deriveListingPlanTier(listing: {
    is_featured?: boolean | null;
    is_premium?: boolean | null;
}): ListingPlanTier {
    if (listing.is_premium) return "premium";
    if (listing.is_featured) return "featured";
    return "free";
}

export function getListingPlanFlags(plan: ListingPlanTier) {
    return {
        is_featured: plan === "featured" || plan === "premium",
        is_premium: plan === "premium",
    };
}
