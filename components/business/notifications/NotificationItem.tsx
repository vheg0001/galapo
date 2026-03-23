"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — NotificationItem Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import { getRelativeTime } from "@/lib/utils";
import type { BusinessNotification } from "@/store/businessStore";

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
};

interface NotificationItemProps {
    notification: BusinessNotification;
    onRead: (id: string) => void;
}

export default function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
    const handleClick = () => {
        if (!n.is_read) {
            onRead(n.id);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`flex cursor-pointer items-start gap-4 border-b border-gray-50 px-4 py-4 transition hover:bg-gray-50 ${!n.is_read ? "bg-[#FF6B35]/[0.03]" : "bg-white"
                }`}
        >
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
                {TYPE_ICONS[n.type] ?? "🔔"}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {n.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{getRelativeTime(n.created_at)}</span>
                        {!n.is_read && (
                            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#FF6B35]" />
                        )}
                    </div>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
            </div>
        </div>
    );
}
