import { addDays } from "date-fns";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { resolveQuery, resolveSingleQuery } from "@/lib/supabase-query-utils";
import {
    fetchSubscriptionSettings,
    getPricingSettings,
    getDaysRemaining,
    getSubscriptionStatus,
    mapPaymentInstructions,
    normalizePlanType,
    PLAN_HIERARCHY,
} from "@/lib/subscription-helpers";
import type {
    Category,
    Payment,
    PaymentInstructionsConfig,
    PaymentStatus,
    PlanTier,
    Subscription,
    SubscriptionListItem,
    TopSearchAvailabilityResponse,
    TopSearchPlacement,
} from "@/lib/types";

type OwnedListing = {
    id: string;
    owner_id: string | null;
    business_name: string;
    status?: string | null;
    is_featured?: boolean | null;
    is_premium?: boolean | null;
    category_id?: string | null;
    subcategory_id?: string | null;
    slug?: string | null;
};

type OwnerProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
};

type CategoryLookupRow = {
    id: string;
    name: string;
};

type PlacementAvailabilityRow = Pick<
    TopSearchPlacement,
    "id" | "listing_id" | "category_id" | "position" | "is_active" | "start_date" | "end_date" | "payment_id"
>;

type PaymentStatusRow = {
    id: string;
    status: PaymentStatus;
};

type ListingNameRow = {
    id: string;
    business_name: string;
};

export const BILLING_CYCLE_DAYS = 30;
export const EXPIRING_SOON_DAYS = 14;
export const MAX_PAYMENT_PROOF_SIZE = 10 * 1024 * 1024;
export const ALLOWED_PAYMENT_PROOF_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const ACTIVE_LISTING_STATUSES = ["approved", "claimed_pending"];

export function calculateFutureBillingPeriod(startDate?: string | null) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = addDays(start, BILLING_CYCLE_DAYS);

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

export async function ensureOwnedListing(userId: string, listingId: string) {
    const admin = createAdminSupabaseClient();
    const query = admin
        .from("listings")
        .select(
            "id, owner_id, business_name, status, is_featured, is_premium, category_id, subcategory_id, slug"
        )
        .eq("id", listingId);
    const { data: listing, error } = await resolveSingleQuery<OwnedListing>(query);

    if (error) {
        throw error;
    }

    if (!listing || listing.owner_id !== userId) {
        const ownedError = new Error("Listing not found or not owned by the authenticated user.");
        (ownedError as Error & { status?: number }).status = 403;
        throw ownedError;
    }

    return listing;
}

export async function getAdminRecipients() {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "super_admin")
        .eq("is_active", true);

    if (error) {
        throw error;
    }

    return (data ?? []).map((row) => row.id as string);
}

export async function getOwnerProfile(userId: string) {
    const admin = createAdminSupabaseClient();
    const query = admin
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", userId);
    const { data, error } = await resolveSingleQuery<OwnerProfile>(query);

    if (error) {
        throw error;
    }

    return data;
}

export async function createPendingPaymentRecord({
    subscriptionId,
    listingId,
    userId,
    amount,
    description,
    paymentMethod = "gcash",
}: {
    subscriptionId: string | null;
    listingId: string;
    userId: string;
    amount: number;
    description: string;
    paymentMethod?: "gcash" | "bank_transfer";
}): Promise<Payment> {
    const admin = createAdminSupabaseClient();

    const { data, error } = await admin
        .from("payments")
        .insert({
            subscription_id: subscriptionId,
            listing_id: listingId,
            user_id: userId,
            amount,
            payment_method: paymentMethod,
            payment_proof_url: "",
            reference_number: null,
            description,
            status: "pending",
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data as Payment;
}

export async function getSubscriptionPricingAndInstructions(planType: Exclude<PlanTier, "free">) {
    const pricing = await getPricingSettings();
    const settings = await fetchSubscriptionSettings();
    
    const amount =
        planType === "premium"
            ? pricing.premium_monthly
            : pricing.featured_monthly;

    return {
        amount,
        paymentInstructions: mapPaymentInstructions(settings, amount),
    };
}

export async function getTopSearchPricingAndInstructions() {
    const pricing = await getPricingSettings();
    const settings = await fetchSubscriptionSettings();
    const amount = pricing.top_search_monthly;

    return {
        amount,
        paymentInstructions: mapPaymentInstructions(settings, amount),
    };
}

export async function mapPaymentInstructionsFromAmount(amount: number): Promise<PaymentInstructionsConfig> {
    const settings = await fetchSubscriptionSettings();
    return mapPaymentInstructions(settings, amount);
}

export async function fetchCategoriesMap(categoryIds: Array<string | null | undefined>) {
    const ids = Array.from(new Set(categoryIds.filter(Boolean))) as string[];
    if (ids.length === 0) {
        return {} as Record<string, Category>;
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from("categories").select("id, name, slug, parent_id, icon, sort_order, is_active, created_at").in("id", ids);

    if (error) {
        throw error;
    }

    return (data ?? []).reduce<Record<string, Category>>((acc, row) => {
        acc[row.id] = row as Category;
        return acc;
    }, {});
}

export function deriveActualPlan(listing: { is_featured?: boolean | null; is_premium?: boolean | null }): PlanTier {
    if (listing.is_premium) return "premium";
    if (listing.is_featured) return "featured";
    return "free";
}

export function pickDisplaySubscription(subscriptions: Subscription[]) {
    const sorted = [...subscriptions].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // 1. Prefer truly active or "active but cancelled" (not yet expired)
    const activeOrCancelled = sorted.find((subscription) => {
        const status = getSubscriptionStatus(subscription, EXPIRING_SOON_DAYS);
        return status === "active" || status === "expiring_soon" || status === "cancelled";
    });

    if (activeOrCancelled) {
        return activeOrCancelled;
    }

    // 2. Fallback to pending
    return sorted.find((subscription) => subscription.status === "pending_payment") ?? sorted[0] ?? null;
}

export function buildSubscriptionListItems({
    listings,
    subscriptions,
    placements,
    payments,
    reactivation_fees,
    categories,
}: {
    listings: any[];
    subscriptions: any[];
    placements: any[];
    payments: any[];
    reactivation_fees?: any[];
    categories: Record<string, Category>;
}): SubscriptionListItem[] {
    const paymentsMap = new Map<string, any>((payments ?? []).map((payment) => [payment.id, payment]));

    return listings.map((listing) => {
        const listingSubscriptions = (subscriptions ?? []).filter(
            (subscription) => subscription.listing_id === listing.id
        ) as Subscription[];
        const selectedSubscription = pickDisplaySubscription(listingSubscriptions);
        const actualPlan = deriveActualPlan(listing);

        const listingPlacements = (placements ?? []).filter(
            (placement) => placement.listing_id === listing.id
        ) as TopSearchPlacement[];

        const linkedPayment = selectedSubscription?.id
            ? (payments ?? []).find(p => p.subscription_id === selectedSubscription.id && p.status === "pending")
            : null;
        const hasProof = linkedPayment && typeof linkedPayment.payment_proof_url === "string" && linkedPayment.payment_proof_url.trim().length > 0;

        const rawStatus = selectedSubscription ? getSubscriptionStatus(selectedSubscription, EXPIRING_SOON_DAYS) : "expired";
        const isUnderReview = rawStatus === "pending_payment" && hasProof;
        const finalStatus = isUnderReview ? "under_review" : rawStatus;

        // Reactivation Fee mapping
        const listingFee = (reactivation_fees ?? []).find(f => f.listing_id === listing.id && f.status === "pending");

        return {
            listing_id: listing.id,
            listing_name: listing.business_name,
            listing_slug: listing.slug,
            category_id: listing.category_id,
            category_name: listing.category_id ? categories[listing.category_id]?.name ?? null : null,
            subcategory_id: listing.subcategory_id,
            subcategory_name: listing.subcategory_id
                ? categories[listing.subcategory_id]?.name ?? null
                : null,
            listing_status: listing.status,
            is_deactivated: listing.status === "deactivated",
            current_plan: actualPlan,
            subscription: selectedSubscription
                ? {
                    id: selectedSubscription.id,
                    plan_type: normalizePlanType(String(selectedSubscription.plan_type)),
                    status: finalStatus as any,
                    start_date: selectedSubscription.start_date,
                    end_date: selectedSubscription.end_date,
                    days_remaining: getDaysRemaining(selectedSubscription.end_date),
                    is_expiring_soon: finalStatus === "expiring_soon",
                    auto_renew: Boolean(selectedSubscription.auto_renew),
                    amount: Number(selectedSubscription.amount ?? 0),
                    payment_id: linkedPayment?.id || null,
                }
                : null,
            reactivation_fee: listingFee ? {
                id: listingFee.id,
                amount: listingFee.amount,
                status: listingFee.status,
                payment_id: listingFee.payment_id
            } : null,
            top_search_placements: listingPlacements.map((placement) => {
                const linkedPayment = placement.payment_id
                    ? paymentsMap.get(placement.payment_id)
                    : null;
                
                const hasProof = linkedPayment && typeof linkedPayment.payment_proof_url === "string" && linkedPayment.payment_proof_url.trim().length > 0;
                const pendingPayment = !placement.payment_id || (linkedPayment?.status === "pending" && !hasProof);
                const underReview = linkedPayment?.status === "pending" && hasProof;
                
                const placementActive =
                    Boolean(placement.is_active) &&
                    Boolean(placement.end_date) &&
                    new Date(placement.end_date as string).getTime() > Date.now();

                return {
                    id: placement.id,
                    category_id: placement.category_id,
                    category_name: placement.category_id
                        ? categories[placement.category_id]?.name ?? "Unknown Category"
                        : "Unknown Category",
                    position: placement.position,
                    status: pendingPayment
                        ? "pending_payment"
                        : underReview
                            ? "under_review"
                            : placementActive
                                ? "active"
                                : "expired",
                    start_date: placement.start_date,
                    end_date: placement.end_date,
                    payment_id: placement.payment_id,
                    listing_slug: listing.slug,
                };
            }),
        } satisfies SubscriptionListItem;
    });
}

export async function getTopSearchAvailability(categoryId: string): Promise<TopSearchAvailabilityResponse> {
    const admin = createAdminSupabaseClient();

    const categoryQuery = admin.from("categories").select("id, name").eq("id", categoryId);
    const placementsQuery = admin
        .from("top_search_placements")
        .select("id, listing_id, category_id, position, is_active, start_date, end_date, payment_id")
        .eq("category_id", categoryId);

    const [{ data: category, error: categoryError }, { data: placements, error: placementsError }] = await Promise.all([
        resolveSingleQuery<CategoryLookupRow>(categoryQuery),
        resolveQuery<PlacementAvailabilityRow[]>(placementsQuery),
    ]);

    if (categoryError) throw categoryError;
    if (!category) {
        const error = new Error("Category not found.");
        (error as Error & { status?: number }).status = 404;
        throw error;
    }
    if (placementsError) throw placementsError;

    const paymentIds = (placements ?? [])
        .map((placement) => placement.payment_id)
        .filter(Boolean) as string[];

    const listingIds = (placements ?? [])
        .map((placement) => placement.listing_id)
        .filter(Boolean) as string[];

    const [{ data: payments }, { data: listings }] = await Promise.all([
        paymentIds.length > 0
            ? resolveQuery<PaymentStatusRow[]>(
                admin.from("payments").select("id, status").in("id", paymentIds)
            )
            : Promise.resolve({ data: [], error: null }),
        listingIds.length > 0
            ? resolveQuery<ListingNameRow[]>(
                admin.from("listings").select("id, business_name").in("id", listingIds)
            )
            : Promise.resolve({ data: [], error: null }),
    ]);

    const paymentMap = new Map<string, { id: string; status: PaymentStatus }>(
        (payments ?? []).map((payment) => [payment.id, payment])
    );
    const listingMap = new Map<string, string>((listings ?? []).map((listing) => [listing.id, listing.business_name]));

    const activeSlots = new Map<number, { listing_name?: string }>();

    (placements ?? []).forEach((placement) => {
        const linkedPayment = placement.payment_id ? paymentMap.get(placement.payment_id) : null;
        const isPending = linkedPayment?.status === "pending";
        const activeEndDate = placement.end_date;
        const isActive =
            Boolean(placement.is_active) &&
            Boolean(activeEndDate) &&
            new Date(activeEndDate ?? "").getTime() > Date.now();
        const hasExplicitLifecycleState =
            placement.is_active !== undefined ||
            placement.end_date !== undefined ||
            placement.payment_id !== undefined;

        if (isPending || isActive || (!hasExplicitLifecycleState && placement.position)) {
            activeSlots.set(placement.position, {
                listing_name: listingMap.get(placement.listing_id),
            });
        }
    });

    const slots = [1, 2, 3].map((position) => {
        const slot = activeSlots.get(position);
        return slot
            ? { position, status: "taken" as const, listing_name: slot.listing_name }
            : { position, status: "available" as const };
    });

    return {
        category_name: category.name,
        slots,
        available_count: slots.filter((slot) => slot.status === "available").length,
    };
}

export function getLowestAvailablePosition(availability: TopSearchAvailabilityResponse): number | null {
    return availability.slots.find((slot) => slot.status === "available")?.position ?? null;
}

export function assertPlanUpgrade(currentPlan: PlanTier, requestedPlan: PlanTier) {
    if (requestedPlan === "free") {
        const error = new Error("Free is not a paid subscription upgrade target.");
        (error as Error & { status?: number }).status = 400;
        throw error;
    }

    if (PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requestedPlan]) {
        const error = new Error("This listing already has the same or a higher plan.");
        (error as Error & { status?: number }).status = 409;
        throw error;
    }
}

export function validatePaymentProofFile(file: File) {
    if (!ALLOWED_PAYMENT_PROOF_TYPES.includes(file.type)) {
        const error = new Error("Unsupported file type. Please upload JPG, PNG, or PDF.");
        (error as Error & { status?: number }).status = 400;
        throw error;
    }

    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
        const error = new Error("Payment proof exceeds the 10MB size limit.");
        (error as Error & { status?: number }).status = 400;
        throw error;
    }
}
