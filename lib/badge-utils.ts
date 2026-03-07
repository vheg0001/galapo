import type { ListingBadge } from "./types";

// ──────────────────────────────────────────────────────────────
// Badge priority helpers
// Priority numbers: lower = more important
//   Plan badges:  0  (premium), 1  (featured), 2  (free)
//   Admin/system: 10+ (Must Visit, Editor's Pick, Eco, etc.)
// ──────────────────────────────────────────────────────────────

/** Return only active, non-expired listing badges. */
export function getActiveBadges(badges: ListingBadge[]): ListingBadge[] {
    if (!badges || badges.length === 0) return [];
    const now = new Date();
    return badges.filter((lb) => {
        if (!lb.is_active || !lb.badge?.is_active) return false;
        if (lb.expires_at && new Date(lb.expires_at) < now) return false;
        return true;
    });
}

/** Return active badges sorted by priority (plan badges first, then admin/system). */
export function getSortedBadges(badges: ListingBadge[]): ListingBadge[] {
    return [...getActiveBadges(badges)].sort((a, b) => {
        const pa = a.badge?.priority ?? 50;
        const pb = b.badge?.priority ?? 50;
        return pa - pb;
    });
}

/**
 * Return the max-2 badges to show on a listing card.
 *
 * Rules:
 *   1. At most ONE plan badge (the highest-priority plan badge).
 *   2. At most ONE non-plan badge (the highest-priority admin/system badge).
 *   3. Plan badge always shown before the admin badge.
 */
export function getCardBadges(
    badges: ListingBadge[],
    isPremium?: boolean,
    isFeatured?: boolean
): ListingBadge[] {
    const active = getActiveBadges(badges);

    const planBadges = active
        .filter((lb) => lb.badge?.type === "plan")
        .sort((a, b) => (a.badge?.priority ?? 50) - (b.badge?.priority ?? 50));

    const adminBadges = active
        .filter((lb) => lb.badge?.type !== "plan")
        .sort((a, b) => (a.badge?.priority ?? 50) - (b.badge?.priority ?? 50));

    const result: ListingBadge[] = [];
    let planSlotTaken = false;

    if (planBadges.length > 0) {
        result.push(planBadges[0]);
        planSlotTaken = true;
    } else if (isPremium || isFeatured) {
        planSlotTaken = true;
    }

    // Admin badges are now shown below the title, allowing up to 3 max.
    const maxAdminBadges = 3;
    let adminCount = 0;

    for (const adminBadge of adminBadges) {
        if (adminCount < maxAdminBadges) {
            result.push(adminBadge);
            adminCount++;
        } else {
            break;
        }
    }

    return result;
}

// ──────────────────────────────────────────────────────────────
// Map pin tier
// ──────────────────────────────────────────────────────────────

export type PinTier = "premium" | "featured" | "special" | "regular";

/**
 * Determine the map-pin colour tier for a listing.
 *
 * Tier hierarchy (highest wins):
 *   premium  → Gold   (#F59E0B)  — has a "premium" plan badge OR isPremium flag
 *   featured → Orange (#FF6B35)  — has a "featured" plan badge OR isFeatured flag
 *   special  → Green  (#22C55E)  — has Must Visit / Editor's Pick admin badge (priority ≤ 15)
 *   regular  → Blue   (#3B82F6)
 *
 * Badge slugs for "special" tier (case-insensitive slug match):
 *   must-visit, editors-pick, editor-pick, editor-s-pick
 */
const SPECIAL_BADGE_SLUGS = new Set([
    "must-visit",
    "editors-pick",
    "editor-pick",
    "editor-s-pick",
    "must_visit",
    "editors_pick",
]);

export function getPinTier(
    badges: ListingBadge[],
    isPremium?: boolean,
    isFeatured?: boolean,
): PinTier {
    const active = getActiveBadges(badges);

    // 1. Premium
    const hasPremiumBadge = active.some(
        (lb) => lb.badge?.type === "plan" && lb.badge?.slug === "premium",
    );
    if (hasPremiumBadge || isPremium) return "premium";

    // 2. Featured
    const hasFeaturedBadge = active.some(
        (lb) => lb.badge?.type === "plan" && lb.badge?.slug === "featured",
    );
    if (hasFeaturedBadge || isFeatured) return "featured";

    // 3. Special admin badges (Must Visit / Editor's Pick)
    const hasSpecialBadge = active.some(
        (lb) =>
            lb.badge?.type !== "plan" &&
            (SPECIAL_BADGE_SLUGS.has(lb.badge?.slug?.toLowerCase() ?? "") ||
                (lb.badge?.priority ?? 99) <= 15),
    );
    if (hasSpecialBadge) return "special";

    return "regular";
}
