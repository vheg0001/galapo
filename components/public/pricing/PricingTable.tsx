"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import PricingCard from "@/components/public/pricing/PricingCard";
import { PLAN_CARD_META, PLAN_FEATURES } from "@/lib/subscription-config";
import type { PlanFeatureItem } from "@/lib/subscription-config";
import type { AdvertisingPackage, PricingResponse } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

const defaultPricing: PricingResponse = {
    featured_monthly: 299,
    premium_monthly: 599,
    top_search_monthly: 999,
    ad_placement_monthly: 1499,
};

import {
    findPackageByAlias,
    parsePackagePrice,
    normalizePackageName
} from "@/lib/subscription-helpers";

const PLAN_PACKAGE_ALIASES = {
    free: ["free", "free listing", "free plan", "forever free"],
    featured: ["featured", "featured listing", "featured plan"],
    premium: ["premium", "premium listing", "premium plan"],
    top_search: ["top search", "top placement", "sponsored placement", "sponsored search"],
    banner_ads: ["banner ads", "ad placement", "banner assignment", "display ads"],
} as const;

type ManagedPlan = keyof typeof PLAN_PACKAGE_ALIASES;

interface PackageCardData {
    title: string;
    price: number;
    features: PlanFeatureItem[];
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    ribbon?: string;
}

function matchesManagedPlan(pkg: AdvertisingPackage, plan: ManagedPlan) {
    const normalizedName = normalizePackageName(pkg.name);

    return PLAN_PACKAGE_ALIASES[plan].some((alias) => {
        const normalizedAlias = normalizePackageName(alias);
        return normalizedName === normalizedAlias || normalizedName.includes(normalizedAlias);
    });
}

function getPackageData(
    pricing: PricingResponse,
    plan: ManagedPlan,
    fallbackPrice: number,
    fallbackFeatures: PlanFeatureItem[],
    fallbackTitle: string,
    fallbackSubtitle: string,
    fallbackCtaLabel: string,
    fallbackCtaHref: string,
    fallbackRibbon?: string
): PackageCardData {
    const pkg = findPackageByAlias(pricing.advertising_packages || [], PLAN_PACKAGE_ALIASES[plan]);

    if (!pkg) {
        return {
            title: fallbackTitle,
            price: fallbackPrice,
            features: fallbackFeatures,
            subtitle: fallbackSubtitle,
            ctaLabel: fallbackCtaLabel,
            ctaHref: fallbackCtaHref,
            ribbon: fallbackRibbon,
        };
    }

    // Merge perks: If it's featured or premium and dynamic features exist, ensure hierarchical context is preserved
    let features: PlanFeatureItem[] = [];
    if (Array.isArray(pkg.features) && pkg.features.length > 0) {
        const dynamicPerks = pkg.features.map<PlanFeatureItem>((feature) => ({ label: feature, included: true }));
        
        // Add hierarchical context if not already present
        const contextLabel = plan === "featured" ? "Everything in Free, plus:" : plan === "premium" ? "Everything in Featured, plus:" : null;
        const hasContext = contextLabel && dynamicPerks.some(p => p.label.toLowerCase().includes(contextLabel.toLowerCase()));
        
        if (contextLabel && !hasContext) {
            features = [{ label: contextLabel, included: true }, ...dynamicPerks];
        } else {
            features = dynamicPerks;
        }
    } else {
        features = fallbackFeatures;
    }

    return {
        title: pkg.name || fallbackTitle,
        price: parsePackagePrice(pkg.price, fallbackPrice),
        features,
        subtitle: pkg.description || fallbackSubtitle,
        ctaLabel: pkg.button_text || fallbackCtaLabel,
        ctaHref: pkg.button_link || fallbackCtaHref,
        ribbon: pkg.is_popular ? "POPULAR" : undefined,
    };
}

export default function PricingTable({ initialPricing }: { initialPricing?: PricingResponse }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [pricing, setPricing] = useState<PricingResponse>(initialPricing || defaultPricing);
    const [isLoading, setIsLoading] = useState(!initialPricing);

    useEffect(() => {
        let mounted = true;

        async function loadPricing() {
            try {
                const response = await fetch("/api/pricing", { cache: "no-store" });
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || "Failed to fetch pricing.");
                }

                if (mounted) {
                    setPricing(payload);
                }
            } catch (error) {
                console.error("PricingTable: failed to fetch pricing", error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        loadPricing();

        return () => {
            mounted = false;
        };
    }, []);

    const cards = useMemo(
        () => {
            const freeData = getPackageData(
                pricing,
                "free",
                0,
                PLAN_FEATURES.free,
                PLAN_CARD_META.free.title,
                PLAN_CARD_META.free.subtitle,
                "Get Started Free",
                "/register"
            );
            const featuredData = getPackageData(
                pricing,
                "featured",
                pricing.featured_monthly,
                PLAN_FEATURES.featured,
                PLAN_CARD_META.featured.title,
                PLAN_CARD_META.featured.subtitle,
                "Upgrade to Featured",
                isAuthenticated ? "/business/subscription" : "/register",
                PLAN_CARD_META.featured.ribbon
            );
            const premiumData = getPackageData(
                pricing,
                "premium",
                pricing.premium_monthly,
                PLAN_FEATURES.premium,
                PLAN_CARD_META.premium.title,
                PLAN_CARD_META.premium.subtitle,
                "Upgrade to Premium",
                isAuthenticated ? "/business/subscription" : "/register"
            );

            return [
                {
                    ...PLAN_CARD_META.free,
                    title: freeData.title,
                    price: freeData.price,
                    features: freeData.features,
                    subtitle: freeData.subtitle,
                    ribbon: freeData.ribbon,
                    ctaLabel: freeData.ctaLabel,
                    ctaHref: freeData.ctaHref,
                },
                {
                    ...PLAN_CARD_META.featured,
                    title: featuredData.title,
                    price: featuredData.price,
                    features: featuredData.features,
                    subtitle: featuredData.subtitle,
                    ribbon: featuredData.ribbon,
                    ctaLabel: featuredData.ctaLabel,
                    ctaHref: isAuthenticated ? "/business/subscription" : featuredData.ctaHref,
                },
                {
                    ...PLAN_CARD_META.premium,
                    title: premiumData.title,
                    price: premiumData.price,
                    features: premiumData.features,
                    subtitle: premiumData.subtitle,
                    ribbon: premiumData.ribbon,
                    ctaLabel: premiumData.ctaLabel,
                    ctaHref: isAuthenticated ? "/business/subscription" : premiumData.ctaHref,
                },
            ];
        },
        [isAuthenticated, pricing]
    );

    return (
        <div className="space-y-6">
            {isLoading ? (
                <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading latest pricing…
                    </div>
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
                {cards.map((card) => (
                    <PricingCard
                        key={card.plan}
                        title={card.title}
                        subtitle={card.subtitle}
                        icon={card.icon}
                        price={card.price}
                        ribbon={card.ribbon}
                        accent={card.accent}
                        features={card.features}
                        ctaLabel={card.ctaLabel}
                        ctaHref={card.ctaHref}
                    />
                ))}
            </div>
        </div>
    );
}