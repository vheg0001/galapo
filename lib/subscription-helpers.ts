import { addDays, differenceInCalendarDays } from "date-fns";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type {
    AdvertisingPackage,
    ComputedSubscriptionStatus,
    PaymentInstructionsConfig,
    PlanTier,
    PricingResponse,
    Subscription,
} from "@/lib/types";

export const PLAN_HIERARCHY: Record<PlanTier, number> = {
    free: 0,
    featured: 1,
    premium: 2,
};

const SETTINGS_KEYS = [
    "featured_listing_monthly_price",
    "premium_listing_monthly_price",
    "top_search_monthly_price",
    "ad_placement_monthly_price",
    "advertising_packages",
    "price_featured",
    "price_premium",
    "price_top_search",
    "price_ad_banner",
    "gcash_number",
    "gcash_name",
    "gcash_qr_url",
    "bank_name",
    "bank_account_number",
    "bank_account_name",
    "bank_details",
    "payment_instructions",
] as const;

export function normalizePlanType(planType?: string | null): PlanTier {
    if (planType === "premium") return "premium";
    if (planType === "featured") return "featured";
    return "free";
}

export function isUpgrade(currentPlan: PlanTier, newPlan: PlanTier): boolean {
    return PLAN_HIERARCHY[newPlan] > PLAN_HIERARCHY[currentPlan];
}

export function isDowngrade(currentPlan: PlanTier, newPlan: PlanTier): boolean {
    return PLAN_HIERARCHY[newPlan] < PLAN_HIERARCHY[currentPlan];
}

export function getPlanChangeDirection(
    currentPlan?: string | null,
    newPlan?: string | null
): "upgrade" | "downgrade" | "same" {
    const normalizedCurrentPlan = normalizePlanType(currentPlan);
    const normalizedNewPlan = normalizePlanType(newPlan);

    if (isUpgrade(normalizedCurrentPlan, normalizedNewPlan)) return "upgrade";
    if (isDowngrade(normalizedCurrentPlan, normalizedNewPlan)) return "downgrade";
    return "same";
}

export function calculateBillingPeriod(startDate: Date | string = new Date()) {
    const start = new Date(startDate);
    const end = addDays(start, 30);

    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

export function getDaysRemaining(endDate?: string | null): number {
    if (!endDate) return 0;

    return Math.max(0, differenceInCalendarDays(new Date(endDate), new Date()));
}

export function getSubscriptionStatus(
    subscription?: Pick<Subscription, "status" | "end_date"> | null,
    warningDays = 14
): ComputedSubscriptionStatus {
    if (!subscription) return "expired";

    if (subscription.status === "pending_payment") return "pending_payment";


    if (!subscription.end_date) return "pending_payment";

    const daysRemaining = getDaysRemaining(subscription.end_date);
    if (daysRemaining <= 0) return "expired";

    if (subscription.status === "cancelled") return "cancelled";
    if (daysRemaining < warningDays) return "expiring_soon";

    return "active";
}

function toNumber(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapPricingSettings(settings: Record<string, unknown>): PricingResponse {
    const packages = Array.isArray(settings.advertising_packages)
        ? (settings.advertising_packages as AdvertisingPackage[])
        : [];

    // Help sync legacy fields with dynamic packages if they exist
    const dynamicTopSearch = findPackageByAlias(packages, ["top search", "top placement", "sponsored placement", "sponsored search"]);
    const dynamicBannerAds = findPackageByAlias(packages, ["banner ads", "ad placement", "banner assignment", "display ads"]);
    const dynamicFeatured = findPackageByAlias(packages, ["featured", "featured listing", "featured plan"]);
    const dynamicPremium = findPackageByAlias(packages, ["premium", "premium listing", "premium plan"]);

    return {
        featured_monthly: parsePackagePrice(
            (dynamicFeatured?.price as any) ?? (settings.featured_listing_monthly_price as any) ?? (settings.price_featured as any) ?? "",
            299
        ),
        premium_monthly: parsePackagePrice(
            (dynamicPremium?.price as any) ?? (settings.premium_listing_monthly_price as any) ?? (settings.price_premium as any) ?? "",
            599
        ),
        top_search_monthly: parsePackagePrice(
            (dynamicTopSearch?.price as any) ?? (settings.top_search_monthly_price as any) ?? (settings.price_top_search as any) ?? "",
            999
        ),
        ad_placement_monthly: parsePackagePrice(
            (dynamicBannerAds?.price as any) ?? (settings.ad_placement_monthly_price as any) ?? (settings.price_ad_banner as any) ?? "",
            1499
        ),
        advertising_packages: packages,
    };
}

export function normalizePackageName(value?: string) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function parsePackagePrice(value: string | number, fallbackPrice: number) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallbackPrice;
    }

    const sanitized = String(value ?? "").replace(/[^0-9.]/g, "").trim();
    if (!sanitized) {
        return fallbackPrice;
    }

    const priceNum = Number(sanitized);

    return Number.isFinite(priceNum) ? priceNum : fallbackPrice;
}

export function findPackageByAlias(packages: AdvertisingPackage[], aliases: readonly string[]) {
    if (!packages || !aliases) return undefined;
    
    return packages.find(pkg => {
        const normalizedName = normalizePackageName(pkg.name);
        return aliases.some(alias => {
            const normalizedAlias = normalizePackageName(alias);
            return normalizedName === normalizedAlias || normalizedName.includes(normalizedAlias);
        });
    });
}

export function mapPaymentInstructions(
    settings: Record<string, unknown>,
    amount: number
): PaymentInstructionsConfig {
    const legacyBankDetails =
        typeof settings.bank_details === "object" && settings.bank_details !== null
            ? (settings.bank_details as Record<string, unknown>)
            : {};

    return {
        gcash_number: String(settings.gcash_number ?? "09171234567"),
        gcash_name: String(settings.gcash_name ?? "GalaPo Directory"),
        gcash_qr_url: settings.gcash_qr_url ? String(settings.gcash_qr_url) : null,
        bank_name: String(settings.bank_name ?? legacyBankDetails.bank ?? "BPI"),
        bank_account: String(
            settings.bank_account_number ?? legacyBankDetails.account_number ?? "1234 5678 90"
        ),
        bank_account_name: String(
            settings.bank_account_name ?? legacyBankDetails.account_name ?? "GalaPo Directory"
        ),
        amount,
        instructions_text: String(
            settings.payment_instructions ??
            "After sending your payment, upload a clear screenshot or PDF of the receipt for manual verification."
        ),
    };
}

export async function fetchSubscriptionSettings(): Promise<Record<string, unknown>> {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
        .from("site_settings")
        .select("key, value")
        .in("key", [...SETTINGS_KEYS]);

    if (error) {
        throw error;
    }

    return (data ?? []).reduce<Record<string, unknown>>((acc, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});
}

export async function getPricingSettings(): Promise<PricingResponse> {
    const settings = await fetchSubscriptionSettings();
    return mapPricingSettings(settings);
}

export async function getPaymentInstructions(amount: number): Promise<PaymentInstructionsConfig> {
    const settings = await fetchSubscriptionSettings();
    return mapPaymentInstructions(settings, amount);
}

export async function getActivePlan(listingId: string): Promise<PlanTier> {
    const admin = createAdminSupabaseClient();
    const nowIso = new Date().toISOString();

    const { data: subscription } = await admin
        .from("subscriptions")
        .select("plan_type, status, end_date")
        .eq("listing_id", listingId)
        .eq("status", "active")
        .gte("end_date", nowIso)
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscription?.plan_type) {
        return normalizePlanType(subscription.plan_type);
    }

    const { data: listing } = await admin
        .from("listings")
        .select("is_featured, is_premium")
        .eq("id", listingId)
        .maybeSingle();

    if (listing?.is_premium) return "premium";
    if (listing?.is_featured) return "featured";
    return "free";
}

export async function canUpgrade(listingId: string) {
    const current_plan = await getActivePlan(listingId);
    const available_plans = (Object.keys(PLAN_HIERARCHY) as PlanTier[]).filter((plan) =>
        isUpgrade(current_plan, plan)
    );

    return {
        allowed: available_plans.length > 0,
        current_plan,
        available_plans,
    };
}

export function formatPeso(amount: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
