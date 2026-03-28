type SupportedPlan = "free" | "featured" | "premium";

type PlanBadgeRecord = {
    id: string;
    slug: string;
};

const PLAN_BADGE_SLUGS = ["featured", "premium"] as const;

function normalizePlan(planType: string): SupportedPlan {
    if (planType === "premium") return "premium";
    if (planType === "featured") return "featured";
    return "free";
}

export async function syncListingPlanBadges(
    supabase: any,
    listingId: string,
    planType: string,
    assignedAt = new Date().toISOString()
) {
    const normalizedPlan = normalizePlan(planType);

    const { data: planBadges, error: badgeError } = await supabase
        .from("badges")
        .select("id, slug")
        .eq("type", "plan")
        .in("slug", [...PLAN_BADGE_SLUGS]);

    if (badgeError) {
        throw badgeError;
    }

    const badgeMap = new Map<string, PlanBadgeRecord>(
        ((planBadges || []) as PlanBadgeRecord[]).map((badge) => [badge.slug, badge])
    );

    const removableBadgeIds = [...badgeMap.values()].map((badge) => badge.id);

    if (removableBadgeIds.length > 0) {
        const { error: deleteError } = await supabase
            .from("listing_badges")
            .delete()
            .eq("listing_id", listingId)
            .in("badge_id", removableBadgeIds);

        if (deleteError) {
            throw deleteError;
        }
    }

    if (normalizedPlan === "free") {
        return;
    }

    const targetBadge = badgeMap.get(normalizedPlan);
    if (!targetBadge) {
        throw new Error(`Plan badge not found for ${normalizedPlan}`);
    }

    const { error: insertError } = await supabase
        .from("listing_badges")
        .insert({
            listing_id: listingId,
            badge_id: targetBadge.id,
            assigned_at: assignedAt,
            is_active: true,
        });

    if (insertError) {
        throw insertError;
    }
}
