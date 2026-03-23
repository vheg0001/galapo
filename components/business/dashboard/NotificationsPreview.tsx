"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — NotificationsPreview Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { Bell } from "lucide-react";
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
    payment_confirmed: "💳",
    payment_rejected: "❌",
    new_listing_submitted: "📝",
    listing_deactivated: "🔴",
};

interface NotificationsPreviewProps {
    notifications: BusinessNotification[];
    loading?: boolean;
}

export default function NotificationsPreview({ notifications, loading = false }: NotificationsPreviewProps) {
    const unread = notifications.filter((n) => !n.is_read);
    const preview = notifications.slice(0, 5);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                ))}
            </div>
        );
    }

    if (preview.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell size={32} className="text-gray-200" />
                <p className="mt-3 text-sm text-gray-400">No notifications yet</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-50">
            {preview.map((n) => (
                <Link
                    key={n.id}
                    href="/business/notifications"
                    className={`flex items-start gap-3 px-0 py-3 transition hover:bg-gray-50/60 ${!n.is_read ? "bg-[#FF6B35]/3" : ""
                        }`}
                >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-sm">
                        {TYPE_ICONS[n.type] ?? "🔔"}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                            {n.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">{n.message}</p>
                    </div>
                    <div className="shrink-0 text-xs text-gray-400">{getRelativeTime(n.created_at)}</div>
                </Link>
            ))}
        </div>
    );
}
