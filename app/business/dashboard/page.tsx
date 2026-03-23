"use client";

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {firstName}! 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">{getTodayPhilippine()}</p>
                </div>
                <QuickActions />
            </div>

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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">My Listings</h2>
                        <Link
                            href="/business/listings"
                            className="flex items-center gap-0.5 text-xs font-medium text-[#FF6B35] hover:underline"
                        >
                            View All <ChevronRight size={13} />
                        </Link>
                    </div>
                    <ListingsTable listings={listings} loading={isLoading} />
                </section>

                <section className="flex flex-col">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">Subscription</h2>
                        <Link
                            href="/business/subscription"
                            className="flex items-center gap-0.5 text-xs font-medium text-[#FF6B35] hover:underline"
                        >
                            Manage <ChevronRight size={13} />
                        </Link>
                    </div>
                    <div className="flex-1 rounded-xl border border-gray-100 bg-white p-5">
                        <SubscriptionStatus subscription={activeSubscription} loading={isLoading} />
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-xl border border-gray-100 bg-white p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
                        <Link
                            href="/business/notifications"
                            className="flex items-center gap-0.5 text-xs font-medium text-[#FF6B35] hover:underline"
                        >
                            View All <ChevronRight size={13} />
                        </Link>
                    </div>
                    <RecentActivity notifications={notifications} loading={isLoading} />
                </section>

                <section className="rounded-xl border border-gray-100 bg-white p-5">
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
                </section>
            </div>
        </div>
    );
}
