"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — SubscriptionStatus Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { CreditCard, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ActiveSubscription } from "@/store/businessStore";

interface SubscriptionStatusProps {
    subscription: ActiveSubscription | null;
    loading?: boolean;
}

const PLAN_STYLES = {
    free: { label: "Free", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100" },
    featured: { label: "Featured", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" },
    premium: { label: "Premium", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-100" },
};

export default function SubscriptionStatus({ subscription, loading = false }: SubscriptionStatusProps) {
    if (loading) {
        return <div className="h-24 animate-pulse rounded-xl bg-gray-100" />;
    }

    if (!subscription || subscription.plan_type === "free") {
        return (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-[#FF6B35]/30 bg-[#FF6B35]/5 p-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/10">
                    <Zap size={22} className="text-[#FF6B35]" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Upgrade Your Listing</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Get more visibility with Featured or Premium. Appear at the top of search results and more.
                    </p>
                </div>
                <Link
                    href="/business/subscription"
                    className="shrink-0 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e55a25]"
                >
                    Upgrade Now
                </Link>
            </div>
        );
    }

    const style = PLAN_STYLES[subscription.plan_type];
    const expiresDate = new Date(subscription.end_date);
    const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysLeft <= 7;

    return (
        <div className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60">
                        <CreditCard size={18} className={style.color} />
                    </div>
                    <div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>
                            {style.label} Plan
                        </span>
                        <p className="text-sm font-medium text-gray-800">{subscription.listing_name}</p>
                    </div>
                </div>

                <Link
                    href="/business/subscription"
                    className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    Renew
                </Link>
            </div>

            <div className={`mt-3 flex items-center gap-2 text-xs ${isExpiringSoon ? "text-red-600" : "text-gray-500"}`}>
                {isExpiringSoon ? (
                    <>⚠️ Expires in <strong>{daysLeft} days</strong> — {formatDate(subscription.end_date)}</>
                ) : (
                    <>Expires: {formatDate(subscription.end_date)}</>
                )}
            </div>
        </div>
    );
}
