"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Notifications Page (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import NotificationList from "@/components/business/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const {
        notifications,
        unreadCount,
        isLoadingNotifications,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
    } = useBusinessStore();

    useEffect(() => {
        if (user?.id) {
            fetchNotifications(user.id);
        }
    }, [user?.id, fetchNotifications]);

    const handleMarkAllRead = async () => {
        if (!user?.id) return;
        await markAllNotificationsRead(user.id);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-[#FF6B35] px-2.5 py-0.5 text-sm font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Stay updated on your listings and account activity
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                        <CheckCheck size={16} />
                        Mark All as Read
                    </button>
                )}
            </div>

            {/* Notification List */}
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <NotificationList
                    notifications={notifications}
                    loading={isLoadingNotifications}
                    onRead={markNotificationRead}
                />
            </div>
        </div>
    );
}
