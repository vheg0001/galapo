"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — RecentActivity Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import { getRelativeTime } from "@/lib/utils";
import type { BusinessNotification } from "@/store/businessStore";

interface RecentActivityProps {
    notifications: BusinessNotification[];
    loading?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
    listing_approved: "✅",
    listing_rejected: "❌",
    claim_approved: "🏆",
    claim_rejected: "⚠️",
    subscription_expiring: "⏰",
    premium_expiring: "⏰",
    annual_check: "🔍",
    annual_check_warning: "⚠️",
    listing_deactivated: "🔴",
    payment_confirmed: "💳",
    payment_rejected: "❌",
    new_listing_submitted: "📝",
    new_claim_request: "📋",
    new_payment_uploaded: "💰",
    annual_check_flagged: "🚩",
    annual_check_no_response: "📭",
};

export default function RecentActivity({ notifications, loading = false }: RecentActivityProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
                        <div className="flex-1 space-y-1.5 pt-1">
                            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                            <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const recent = notifications.slice(0, 10);

    if (recent.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No recent activity</p>
            </div>
        );
    }

    return (
        <ol className="space-y-0">
            {recent.map((item, idx) => (
                <li key={item.id} className="relative flex gap-3 pb-4">
                    {/* Timeline line */}
                    {idx < recent.length - 1 && (
                        <div
                            className="absolute left-4 top-8 h-full w-px bg-gray-100"
                            aria-hidden
                        />
                    )}

                    {/* Icon bubble */}
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-base">
                        {TYPE_ICONS[item.type] ?? "🔔"}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                        <p className={`text-sm ${item.is_read ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                            {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                            {getRelativeTime(item.created_at)}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
