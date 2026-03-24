// ──────────────────────────────────────────────────────────
// GalaPo — Business Owner Store (Module 8.2)
// ──────────────────────────────────────────────────────────

import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────

export interface DashboardListing {
    id: string;
    business_name: string;
    slug: string;
    status: "pending" | "approved" | "rejected" | "claimed_pending";
    is_featured: boolean;
    is_premium: boolean;
    views_this_month: number;
    clicks_this_month: number;
    category_name: string;
    subcategory_name: string | null;
    primary_image: string | null;
    current_plan: string;
}

export interface DashboardStats {
    totalListings: number;
    totalViews: number;
    totalClicks: number;
    activeDeals: number;
    viewsChange: number;  // percentage vs last month
    clicksChange: number; // percentage vs last month
}

export interface BusinessNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    data: Record<string, any> | null;
    created_at: string;
}

export interface ActiveSubscription {
    id: string;
    listing_id: string;
    listing_name: string;
    plan_type: "free" | "featured" | "premium";
    status: "active" | "expired" | "pending_payment" | "cancelled";
    end_date: string;
    amount: number;
}

// ── Store Interface ───────────────────────────────────────

interface BusinessState {
    listings: DashboardListing[];
    stats: DashboardStats;
    notifications: BusinessNotification[];
    unreadCount: number;
    activeSubscription: ActiveSubscription | null;
    isLoading: boolean;
    isLoadingNotifications: boolean;

    fetchDashboardData: (userId: string) => Promise<void>;
    fetchListings: (userId: string) => Promise<void>;
    fetchNotifications: (userId: string) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: (userId: string) => Promise<void>;
    reset: () => void;
}

// ── Store ─────────────────────────────────────────────────

const defaultStats: DashboardStats = {
    totalListings: 0,
    totalViews: 0,
    totalClicks: 0,
    activeDeals: 0,
    viewsChange: 0,
    clicksChange: 0,
};

export const useBusinessStore = create<BusinessState>()((set, get) => ({
    listings: [],
    stats: defaultStats,
    notifications: [],
    unreadCount: 0,
    activeSubscription: null,
    isLoading: false,
    isLoadingNotifications: false,

    fetchDashboardData: async (userId: string) => {
        if (!userId) return;
        set({ isLoading: true });
        try {
            // Fetch stats from our new API
            const statsRes = await fetch("/api/business/dashboard/stats", { cache: "no-store" });
            if (statsRes.status === 401) {
                set({ stats: defaultStats, listings: [] });
                return;
            }
            const statsData = await statsRes.json();

            if (statsData.error) throw new Error(statsData.error);

            // Fetch listings from our new API
            const listingsRes = await fetch("/api/business/listings?limit=5", { cache: "no-store" });
            if (listingsRes.status === 401) {
                set({ stats: defaultStats, listings: [] });
                return;
            }
            const listingsData = await listingsRes.json();

            if (listingsData.error) throw new Error(listingsData.error);

            set({
                stats: {
                    totalListings: statsData.total_listings,
                    totalViews: statsData.total_views_this_month,
                    totalClicks: statsData.total_clicks_this_month,
                    activeDeals: statsData.active_deals,
                    viewsChange: statsData.views_change_percent,
                    clicksChange: statsData.clicks_change_percent,
                },
                listings: listingsData.data,
            });
        } catch (err) {
            console.error("businessStore: fetchDashboardData error:", err);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchListings: async (userId: string) => {
        if (!userId) return;
        set({ isLoading: true });
        try {
            const res = await fetch("/api/business/listings?limit=50", { cache: "no-store" });
            if (res.status === 401) {
                set({ listings: [] });
                return;
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            set({ listings: data.data });
        } catch (err) {
            console.error("businessStore: fetchListings error:", err);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchNotifications: async (userId: string) => {
        if (!userId) return;
        set({ isLoadingNotifications: true });
        try {
            // Using existing notifications endpoint if it exists, or just direct for now
            // But requirements 3. specified /api/business/activity for source
            const res = await fetch("/api/business/activity", { cache: "no-store" });
            if (res.status === 401) {
                set({ notifications: [], unreadCount: 0 });
                return;
            }
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Fetch unread count separately if needed or derive from list
            const notifications = data as BusinessNotification[];
            const unreadCount = notifications.filter((n) => !n.is_read).length;

            set({ notifications, unreadCount });
        } catch (err) {
            console.error("businessStore: fetchNotifications error:", err);
        } finally {
            set({ isLoadingNotifications: false });
        }
    },

    markNotificationRead: async (id: string) => {
        try {
            // Persist to database
            await fetch("/api/business/activity", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            // Local state update
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (err) {
            console.error("businessStore: markNotificationRead error:", err);
        }
    },

    markAllNotificationsRead: async (userId: string) => {
        if (!userId) return;
        try {
            // Persist to database
            await fetch("/api/business/activity", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true }),
            });

            // Local update
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
                unreadCount: 0,
            }));
        } catch (err) {
            console.error("businessStore: markAllNotificationsRead error:", err);
        }
    },

    reset: () => set({
        listings: [],
        stats: defaultStats,
        notifications: [],
        unreadCount: 0,
        activeSubscription: null,
        isLoading: false,
    }),
}));
