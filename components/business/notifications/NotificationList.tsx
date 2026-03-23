"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — NotificationList Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Bell } from "lucide-react";
import NotificationItem from "@/components/business/notifications/NotificationItem";
import type { BusinessNotification } from "@/store/businessStore";

const PAGE_SIZE = 20;

type Filter = "all" | "unread";

interface NotificationListProps {
    notifications: BusinessNotification[];
    loading?: boolean;
    onRead: (id: string) => void;
}

export default function NotificationList({ notifications, loading = false, onRead }: NotificationListProps) {
    const [filter, setFilter] = useState<Filter>("all");
    const [page, setPage] = useState(1);

    const filtered = filter === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications;

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(0, page * PAGE_SIZE);

    if (loading) {
        return (
            <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
                ))}
            </div>
        );
    }

    return (
        <div>
            {/* Filter Tabs */}
            <div className="flex border-b border-gray-100">
                {(["all", "unread"] as Filter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-5 py-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${filter === f
                                ? "border-[#FF6B35] text-[#FF6B35]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {f}
                        {f === "unread" && notifications.filter((n) => !n.is_read).length > 0 && (
                            <span className="ml-1.5 rounded-full bg-[#FF6B35] px-1.5 py-0.5 text-xs font-bold text-white">
                                {notifications.filter((n) => !n.is_read).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {paged.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Bell size={40} className="text-gray-200" />
                    <p className="mt-4 text-sm font-medium text-gray-500">No notifications yet</p>
                    <p className="text-xs text-gray-400">We'll notify you about important updates here</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-gray-50">
                        {paged.map((n) => (
                            <NotificationItem key={n.id} notification={n} onRead={onRead} />
                        ))}
                    </div>

                    {/* Load More */}
                    {page < totalPages && (
                        <div className="p-4 text-center">
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                                Load more
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
