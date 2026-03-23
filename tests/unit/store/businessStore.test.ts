import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBusinessStore } from "@/store/businessStore";
import { act } from "react";

describe("useBusinessStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch
        global.fetch = vi.fn();
        // Reset store before each test
        act(() => {
            useBusinessStore.getState().reset();
        });
    });

    it("fetchDashboardData populates stats and listings", async () => {
        const mockStats = {
            total_listings: 5,
            total_views_this_month: 100,
            total_clicks_this_month: 25,
            active_deals: 2,
            views_change_percent: 10,
            clicks_change_percent: -5,
        };
        const mockListings = {
            data: [{
                id: "1",
                business_name: "Test Store",
                views_this_month: 20,
                clicks_this_month: 5,
                category_name: "Food",
                subcategory_name: null,
                primary_image: null,
                current_plan: "free"
            }],
        };

        (global.fetch as any)
            .mockResolvedValueOnce(new Response(JSON.stringify(mockStats), { status: 200, headers: { 'content-type': 'application/json' } }))
            .mockResolvedValueOnce(new Response(JSON.stringify(mockListings), { status: 200, headers: { 'content-type': 'application/json' } }));

        await act(async () => {
            await useBusinessStore.getState().fetchDashboardData("user-1");
        });

        const state = useBusinessStore.getState();
        expect(state.stats.totalListings).toBe(5);
        expect(state.stats.totalViews).toBe(100);
        expect(state.stats.viewsChange).toBe(10);
        expect(state.listings).toHaveLength(1);
        expect(state.listings[0].business_name).toBe("Test Store");
    });

    it("fetchListings populates listings array", async () => {
        const mockListings = {
            data: [
                { id: "1", business_name: "L1" },
                { id: "2", business_name: "L2" },
            ],
        };

        (global.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify(mockListings), { status: 200, headers: { 'content-type': 'application/json' } }));

        await act(async () => {
            await useBusinessStore.getState().fetchListings("user-1");
        });

        expect(useBusinessStore.getState().listings).toHaveLength(2);
        expect(useBusinessStore.getState().listings[0].business_name).toBe("L1");
    });

    it("fetchNotifications populates notifications and unreadCount", async () => {
        const mockActivity = [
            { id: "n1", title: "Unread", is_read: false },
            { id: "n2", title: "Read", is_read: true },
        ];

        (global.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify(mockActivity), { status: 200, headers: { 'content-type': 'application/json' } }));

        await act(async () => {
            await useBusinessStore.getState().fetchNotifications("user-1");
        });

        const state = useBusinessStore.getState();
        expect(state.notifications).toHaveLength(2);
        expect(state.unreadCount).toBe(1);
    });

    it("markNotificationRead updates local state", async () => {
        const mockActivity = [{ id: "n1", title: "Unread", is_read: false }];
        (global.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify(mockActivity), { status: 200 }));

        await act(async () => {
            await useBusinessStore.getState().fetchNotifications("user-1");
        });

        expect(useBusinessStore.getState().unreadCount).toBe(1);

        await act(async () => {
            await useBusinessStore.getState().markNotificationRead("n1");
        });

        const state = useBusinessStore.getState();
        expect(state.notifications[0].is_read).toBe(true);
        expect(state.unreadCount).toBe(0);
    });

    it("markAllNotificationsRead updates all locally", async () => {
        const mockActivity = [{ id: "n1", is_read: false }, { id: "n2", is_read: false }];
        (global.fetch as any).mockResolvedValueOnce(new Response(JSON.stringify(mockActivity), { status: 200 }));

        await act(async () => {
            await useBusinessStore.getState().fetchNotifications("user-1");
        });

        expect(useBusinessStore.getState().unreadCount).toBe(2);

        await act(async () => {
            await useBusinessStore.getState().markAllNotificationsRead("user-1");
        });

        const state = useBusinessStore.getState();
        expect(state.unreadCount).toBe(0);
        expect(state.notifications.every(n => n.is_read)).toBe(true);
    });
});
