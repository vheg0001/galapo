"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Business Dashboard Page (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import StatsCard from "@/components/business/dashboard/StatsCard";
import QuickActions from "@/components/business/dashboard/QuickActions";
import ListingsTable from "@/components/business/dashboard/ListingsTable";
import RecentActivity from "@/components/business/dashboard/RecentActivity";
import NotificationsPreview from "@/components/business/dashboard/NotificationsPreview";
import SubscriptionStatus from "@/components/business/dashboard/SubscriptionStatus";


function getTodayPhilippine(): string {
    return new Date().toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Manila",
    });
}

export default function BusinessDashboardPage() {
    const { profile, user } = useAuthStore();
    const {
        listings,
        stats,
        notifications,
        activeSubscription,
        isLoading,
        fetchDashboardData,
        fetchNotifications,
    } = useBusinessStore();

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData(user.id);
            fetchNotifications(user.id);
        }
    }, [user?.id, fetchDashboardData, fetchNotifications]);

    const firstName = profile?.full_name?.split(" ")[0] ?? "there";

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {firstName}! 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">{getTodayPhilippine()}</p>
                </div>
                <QuickActions />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    icon="🏪"
                    label="Total Listings"
                    value={stats.totalListings}
                    loading={isLoading}
                />
                <StatsCard
                    icon="👁️"
                    label="Total Views"
                    value={stats.totalViews}
                    change={stats.viewsChange}
                    loading={isLoading}
                />
                <StatsCard
                    icon="📱"
                    label="Total Clicks"
                    value={stats.totalClicks}
                    change={stats.clicksChange}
                    loading={isLoading}
                />
                <StatsCard
                    icon="🏷️"
                    label="Active Deals"
                    value={stats.activeDeals}
                    loading={isLoading}
                />
            </div>

            {/* Listings + Activity side-by-side on large screens */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* My Listings — takes 2/3 */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-900">My Listings</h2>
                        <Link
                            href="/business/listings"
                            className="flex items-center gap-0.5 text-xs font-medium text-[#FF6B35] hover:underline"
                        >
                            View All <ChevronRight size={13} />
                        </Link>
                    </div>
                    <ListingsTable listings={listings} loading={isLoading} />
                </div>

                {/* Recent Activity — takes 1/3 */}
                <div>
                    <h2 className="mb-4 text-base font-semibold text-gray-900">Recent Activity</h2>
                    <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <RecentActivity notifications={notifications} loading={isLoading} />
                    </div>
                </div>
            </div>

            {/* Notifications + Subscription side-by-side */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Notifications Preview */}
                <div className="rounded-xl border border-gray-100 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">Recent Notifications</h2>
                        <Link
                            href="/business/notifications"
                            className="flex items-center gap-0.5 text-xs font-medium text-[#FF6B35] hover:underline"
                        >
                            View All <ChevronRight size={13} />
                        </Link>
                    </div>
                    <NotificationsPreview notifications={notifications} loading={isLoading} />
                </div>

                {/* Subscription Status */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-base font-semibold text-gray-900">Subscription</h2>
                    <SubscriptionStatus subscription={activeSubscription} loading={isLoading} />
                </div>
            </div>
        </div>
    );
}
