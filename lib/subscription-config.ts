import type { PlanTier } from "@/lib/types";

export interface PlanFeatureItem {
    label: string;
    included: boolean;
}

export interface PlanCardConfig {
    plan: PlanTier;
    title: string;
    icon?: string;
    subtitle: string;
    ribbon?: string;
    accent: "free" | "featured" | "premium";
    ctaLabel: string;
    ctaHref: string;
    features: PlanFeatureItem[];
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatureItem[]> = {
    free: [
        { label: "Basic business listing", included: true },
        { label: "Business hours & contact info", included: true },
        { label: "Up to 5 gallery photos", included: true },
        { label: "1 active Deal or Offer", included: true },
        { label: "Post events to city calendar", included: true },
        { label: "Basic view analytics", included: true },
        { label: "Social media share buttons", included: true },
        { label: "Homepage visibility", included: false },
        { label: "Priority search placement", included: false },
        { label: "Featured/Premium badge", included: false },
        { label: "Detailed performance reports", included: false },
    ],
    featured: [
        { label: "Everything in Free, plus:", included: true },
        { label: "⭐ Featured badge on listing", included: true },
        { label: 'Featured Business on homepage', included: true },
        { label: "Priority in search results", included: true },
        { label: "Up to 10 gallery photos", included: true },
        { label: "Up to 3 active Deals", included: true },
        { label: "Featured deals on homepage", included: true },
        { label: "Featured events on homepage", included: true },
        { label: "Detailed monthly analytics", included: true },
        { label: "Priority approval (24hr)", included: true },
        { label: "Email support (48hr)", included: true },
    ],
    premium: [
        { label: "Everything in Featured, plus:", included: true },
        { label: '👑 Premium "Gold" badge', included: true },
        { label: "Highest search priority", included: true },
        { label: "Infinite gallery photos", included: true },
        { label: "Up to 5 active Deals", included: true },
        { label: "Daily analytics with charts", included: true },
        { label: "Click-through tracking", included: true },
        { label: "Express approval (Same-day)", included: true },
        { label: "Priority support (24hr)", included: true },
    ],
};

export const PRICING_FAQS = [
    {
        question: "How do I upgrade my plan?",
        answer:
            "Sign in to your business dashboard, open Subscription & Billing, choose a listing, select a plan, and submit your payment proof for verification.",
    },
    {
        question: "How does payment work?",
        answer:
            "Payments are made manually via GCash or bank transfer. After paying, upload your screenshot or PDF receipt and our admin team will verify it.",
    },
    {
        question: "Can I cancel anytime?",
        answer:
            "Yes. You can cancel auto-renew any time. Your paid benefits stay active until the end of your current billing period.",
    },
    {
        question: "How long before my listing gets approved?",
        answer:
            "Free listings follow the normal queue. Featured listings are prioritized within 24 hours, while Premium listings receive same-day priority whenever possible.",
    },
    {
        question: "What is Top Search Placement?",
        answer:
            "Top Search Placement is a sponsored category placement that places your business in positions 1 to 3 with a sponsored badge and highlighted styling.",
    },
    {
        question: "How many Top Search slots are available per category?",
        answer:
            "Only 3 sponsored slots are available per category at a time, which keeps the placement exclusive and high-impact.",
    },
];

export const PLAN_CARD_META: Record<PlanTier, Omit<PlanCardConfig, "ctaHref" | "ctaLabel">> = {
    free: {
        plan: "free",
        title: "Free",
        subtitle: "Forever Free",
        accent: "free",
        features: PLAN_FEATURES.free,
    },
    featured: {
        plan: "featured",
        title: "Featured",
        icon: "⭐",
        subtitle: "Most Popular",
        ribbon: "POPULAR",
        accent: "featured",
        features: PLAN_FEATURES.featured,
    },
    premium: {
        plan: "premium",
        title: "Premium",
        icon: "👑",
        subtitle: "Best Value",
        accent: "premium",
        features: PLAN_FEATURES.premium,
    },
};

export const ADD_ONS = {
    topSearch: {
        title: "🔝 Top Search Placement",
        description: "Appear as #1 Sponsored result in your category",
        availabilityLabel: "Available slots: limited to 3 per category",
        features: [
            "Position 1-3 in category search results",
            '"Sponsored" badge',
            "Gold highlight background in results",
            "Maximum visibility in your category",
        ],
        buttonLabel: "Get Top Placement",
        buttonHref: "/business/subscription/top-search",
    },
    bannerAds: {
        title: "📢 Banner Ad Placement",
        description: "Custom banner ads across the entire site",
        features: [
            "Homepage, search results, listing pages, blog",
            "Click tracking & impression reports",
            "Custom design (provide your banner)",
        ],
        buttonLabel: "Contact Us for Ads",
        buttonHref: "/advertise",
    },
};