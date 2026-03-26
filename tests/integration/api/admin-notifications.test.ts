import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
    mockSupabase,
    mockRequireAdmin,
    mockState,
    resetMockState,
} = vi.hoisted(() => {
    const state = {
        thenQueue: [] as any[],
        calls: {
            from: [] as string[],
            eq: [] as any[],
            range: [] as any[],
            insert: [] as any[],
            order: [] as any[],
        },
    };

    const chain: any = {};

    ["select", "eq", "range", "order"].forEach((name) => {
        chain[name] = vi.fn((...args: any[]) => {
            (state.calls as any)[name]?.push(args);
            return chain;
        });
    });

    chain.insert = vi.fn((payload: any) => {
        state.calls.insert.push(payload);
        return chain;
    });

    chain.then = vi.fn((resolve: any, reject: any) =>
        Promise.resolve(state.thenQueue.shift() ?? { data: [], error: null, count: 0 }).then(resolve, reject)
    );

    const client: any = {
        from: vi.fn((table: string) => {
            state.calls.from.push(table);
            return chain;
        }),
    };

    const requireAdmin = vi.fn().mockResolvedValue({
        user: { id: "admin-1" },
        profile: { id: "admin-1", role: "super_admin", is_active: true },
    });

    const reset = () => {
        state.thenQueue = [];
        state.calls = {
            from: [],
            eq: [],
            range: [],
            insert: [],
            order: [],
        };

        Object.values(chain).forEach((fn: any) => fn?.mockClear?.());
        client.from.mockClear();
        requireAdmin.mockReset();
        requireAdmin.mockResolvedValue({
            user: { id: "admin-1" },
            profile: { id: "admin-1", role: "super_admin", is_active: true },
        });
    };

    return {
        mockSupabase: client,
        mockRequireAdmin: requireAdmin,
        mockState: state,
        resetMockState: reset,
    };
});

vi.mock("@/lib/auth-helpers", () => ({
    requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(() => mockSupabase),
}));

import { GET as getNotifications } from "@/app/api/admin/notifications/route";
import { POST as sendNotification } from "@/app/api/admin/notifications/send/route";

describe("Admin Notifications API Integration", () => {
    beforeEach(() => {
        resetMockState();
    });

    it("returns 403 for non-admin notification requests", async () => {
        const forbidden = new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

        mockRequireAdmin.mockResolvedValueOnce({ error: forbidden } as any);
        const listResponse = await getNotifications(new NextRequest("http://localhost/api/admin/notifications"));
        expect(listResponse.status).toBe(403);

        mockRequireAdmin.mockResolvedValueOnce({ error: forbidden } as any);
        const sendResponse = await sendNotification(
            new NextRequest("http://localhost/api/admin/notifications/send", {
                method: "POST",
                body: JSON.stringify({ recipient_id: "user-1", title: "Hello", message: "World" }),
            })
        );
        expect(sendResponse.status).toBe(403);
    });

    it("GET returns admin notifications with user details and unread count", async () => {
        mockState.thenQueue.push(
            {
                count: 1,
                error: null,
            },
            {
                data: [
                    {
                        id: "notif-1",
                        title: "System Maintenance",
                        message: "Tonight at 11pm.",
                        type: "system",
                        is_read: false,
                        profiles: {
                            id: "user-1",
                            full_name: "Jamie Santos",
                            email: "jamie@example.com",
                        },
                    },
                ],
                error: null,
            },
            {
                count: 1,
                error: null,
            },
            {
                count: 4,
                error: null,
            },
            {
                count: 2,
                error: null,
            }
        );

        const response = await getNotifications(
            new NextRequest("http://localhost/api/admin/notifications?type=system&page=1")
        );

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json.notifications).toHaveLength(1);
        expect(json.notifications[0]).toMatchObject({
            id: "notif-1",
            type: "system",
            user: {
                id: "user-1",
                full_name: "Jamie Santos",
            },
        });
        expect(json.stats).toMatchObject({
            total_sent: 1,
            unread_count: 4,
            broadcast_count: 2,
        });
        expect(json.pagination).toMatchObject({ total: 1, page: 1, limit: 50 });
        expect(mockState.calls.eq.some((args) => args[0] === "type" && args[1] === "system")).toBe(true);
        expect(mockState.calls.range.some((args) => args[0] === 0 && args[1] === 49)).toBe(true);
    });

    it("POST sends a targeted notification to a specific user", async () => {
        mockState.thenQueue.push({ data: null, error: null });

        const response = await sendNotification(
            new NextRequest("http://localhost/api/admin/notifications/send", {
                method: "POST",
                body: JSON.stringify({
                    recipient_id: "user-1",
                    type: "system",
                    title: "Payment reminder",
                    message: "Please upload your proof of payment.",
                }),
            })
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            sent_count: 1,
            success: true,
            message: "Notification sent successfully.",
        });
        expect(mockState.calls.insert).toContainEqual(
            expect.objectContaining({
                user_id: "user-1",
                type: "system",
                title: "Payment reminder",
                message: "Please upload your proof of payment.",
                is_read: false,
            })
        );
    });

    it("POST broadcast creates notifications for all business owners", async () => {
        mockState.thenQueue.push(
            {
                data: [{ id: "owner-1" }, { id: "owner-2" }, { id: "owner-3" }],
                error: null,
            },
            { data: null, error: null }
        );

        const response = await sendNotification(
            new NextRequest("http://localhost/api/admin/notifications/send", {
                method: "POST",
                body: JSON.stringify({
                    broadcast: true,
                    type: "annual_check",
                    title: "Verification reminder",
                    message: "Please review your annual verification tasks.",
                }),
            })
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            sent_count: 3,
            success: true,
            message: "Broadcast sent to 3 business owners.",
        });
        expect(mockState.calls.insert[0]).toHaveLength(3);
        expect(mockState.calls.insert[0][0]).toMatchObject({
            user_id: "owner-1",
            type: "annual_check",
            title: "Verification reminder",
        });
    });
});
