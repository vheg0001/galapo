import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
    adminClient,
    businessClient,
    mockRequireAdmin,
    adminState,
    businessState,
    resetMockState,
} = vi.hoisted(() => {
    const createState = () => ({
        thenQueue: [] as any[],
        singleQueue: [] as any[],
        calls: {
            from: [] as string[],
            eq: [] as any[],
            or: [] as any[],
            range: [] as any[],
            update: [] as any[],
            insert: [] as any[],
            in: [] as any[],
            gte: [] as any[],
            lt: [] as any[],
            is: [] as any[],
            order: [] as any[],
            limit: [] as any[],
            not: [] as any[],
        },
    });

    const createChain = (state: ReturnType<typeof createState>) => {
        const chain: any = {};

        ["select", "eq", "or", "range", "in", "gte", "lt", "is", "order", "limit", "not"].forEach((name) => {
            chain[name] = vi.fn((...args: any[]) => {
                if (name in state.calls) {
                    (state.calls as any)[name].push(args);
                }
                return chain;
            });
        });

        chain.insert = vi.fn((payload: any) => {
            state.calls.insert.push(payload);
            return chain;
        });

        chain.update = vi.fn((payload: any) => {
            state.calls.update.push(payload);
            return chain;
        });

        chain.single = vi.fn(() => Promise.resolve(state.singleQueue.shift() ?? { data: null, error: null }));
        chain.then = vi.fn((resolve: any, reject: any) =>
            Promise.resolve(state.thenQueue.shift() ?? { data: [], error: null, count: 0 }).then(resolve, reject)
        );

        return chain;
    };

    const adminState = createState();
    const businessState = createState();

    const adminChain = createChain(adminState);
    const businessChain = createChain(businessState);

    const adminClient = {
        from: vi.fn((table: string) => {
            adminState.calls.from.push(table);
            return adminChain;
        }),
    } as any;

    const businessClient = {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { user: { id: "owner-1" } } },
                error: null,
            }),
        },
        from: vi.fn((table: string) => {
            businessState.calls.from.push(table);
            return businessChain;
        }),
    } as any;

    const requireAdmin = vi.fn().mockResolvedValue({
        user: { id: "admin-1" },
        profile: { id: "admin-1", role: "super_admin", is_active: true },
    });

    const reset = () => {
        for (const state of [adminState, businessState]) {
            state.thenQueue = [];
            state.singleQueue = [];
            state.calls = {
                from: [],
                eq: [],
                or: [],
                range: [],
                update: [],
                insert: [],
                in: [],
                gte: [],
                lt: [],
                is: [],
                order: [],
                limit: [],
                not: [],
            };
        }

        Object.values(adminChain).forEach((fn: any) => fn?.mockClear?.());
        Object.values(businessChain).forEach((fn: any) => fn?.mockClear?.());
        adminClient.from.mockClear();
        businessClient.from.mockClear();
        businessClient.auth.getSession.mockClear();
        businessClient.auth.getSession.mockResolvedValue({
            data: { session: { user: { id: "owner-1" } } },
            error: null,
        });
        requireAdmin.mockReset();
        requireAdmin.mockResolvedValue({
            user: { id: "admin-1" },
            profile: { id: "admin-1", role: "super_admin", is_active: true },
        });
    };

    return {
        adminClient,
        businessClient,
        mockRequireAdmin: requireAdmin,
        adminState,
        businessState,
        resetMockState: reset,
    };
});

vi.mock("@/lib/auth-helpers", () => ({
    requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(() => adminClient),
    createSupabaseClient: vi.fn(() => Promise.resolve(businessClient)),
    createServerSupabaseClient: vi.fn(() => Promise.resolve(businessClient)),
}));

import { GET as getChecks } from "@/app/api/admin/annual-checks/route";
import { PUT as updateCheck } from "@/app/api/admin/annual-checks/[id]/route";
import { POST as batchTrigger } from "@/app/api/admin/annual-checks/batch-trigger/route";
import { GET as getAnnualCheckStats } from "@/app/api/admin/annual-checks/stats/route";
import { POST as postBusinessAnnualCheck } from "@/app/api/business/annual-check/route";

describe("Annual Checks API Integration", () => {
    beforeEach(() => {
        resetMockState();
    });

    it("returns 403 for non-admin annual-check requests", async () => {
        const forbidden = new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

        const calls = [
            () => getChecks(new NextRequest("http://localhost/api/admin/annual-checks")),
            () =>
                updateCheck(
                    new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                        method: "PUT",
                        body: JSON.stringify({ action: "confirm" }),
                    }),
                    { params: Promise.resolve({ id: "check-1" }) }
                ),
            () => batchTrigger(new NextRequest("http://localhost/api/admin/annual-checks/batch-trigger", { method: "POST" })),
            () => getAnnualCheckStats(new NextRequest("http://localhost/api/admin/annual-checks/stats")),
        ];

        for (const invoke of calls) {
            mockRequireAdmin.mockResolvedValueOnce({ error: forbidden } as any);
            const response = await invoke();
            expect(response.status).toBe(403);
        }
    });

    it("GET /api/admin/annual-checks returns filtered checks with owner mapping", async () => {
        adminState.thenQueue.push(
            {
                data: [
                    {
                        id: "check-1",
                        status: "pending",
                        sent_at: "2026-03-20T12:00:00.000Z",
                        response_deadline: "2099-04-01T12:00:00.000Z",
                        responded_at: null,
                        notes: null,
                        listings: {
                            id: "listing-1",
                            business_name: "Cafe Uno",
                            slug: "cafe-uno",
                            is_active: true,
                            last_verified_at: "2025-03-20T12:00:00.000Z",
                            category: "food",
                            owner_id: "owner-1",
                        },
                    },
                ],
                error: null,
                count: 1,
            },
            {
                data: [{ id: "owner-1", full_name: "Jamie Santos", email: "jamie@example.com" }],
                error: null,
            },
            {
                data: [{ listing_id: "listing-1" }],
                error: null,
            },
            { count: 4, error: null },
            { count: 1, error: null },
            { count: 2, error: null }
        );

        const response = await getChecks(
            new NextRequest("http://localhost/api/admin/annual-checks?status=pending&search=cafe&page=2")
        );

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json.data).toHaveLength(1);
        expect(json.data[0]).toMatchObject({
            id: "check-1",
            status: "pending",
            listing: { business_name: "Cafe Uno" },
            owner: { full_name: "Jamie Santos" },
        });
        expect(json.pagination).toMatchObject({ total: 1, page: 2, limit: 20 });
        expect(json.stats).toMatchObject({ pending_response: 4, no_response: 1, confirmed_this_month: 2 });
        expect(adminState.calls.eq.some((args) => args[0] === "status" && args[1] === "pending")).toBe(true);
        expect(adminState.calls.gte.some((args) => args[0] === "response_deadline")).toBe(true);
        expect(adminState.calls.or.some((args) => String(args[0]).includes("business_name.ilike.%cafe%"))).toBe(true);
    });

    it("PUT confirm updates the check, refreshes last_verified_at, and notifies the owner", async () => {
        adminState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                response_deadline: "2026-03-26",
                listings: {
                    id: "listing-1",
                    business_name: "Cafe Uno",
                    owner_id: "owner-1",
                    is_active: true,
                },
            },
            error: null,
        });
        adminState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await updateCheck(
            new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                method: "PUT",
                body: JSON.stringify({ action: "confirm" }),
            }),
            { params: Promise.resolve({ id: "check-1" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({ success: true, action: "confirmed" });
        expect(adminState.calls.update).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: "confirmed" }),
                expect.objectContaining({ last_verified_at: expect.any(String) }),
            ])
        );
        expect(adminState.calls.insert).toContainEqual(
            expect.objectContaining({
                user_id: "owner-1",
                type: "annual_check_confirmed",
                title: "Annual Check Confirmed",
            })
        );
    });

    it("PUT extend adds seven days to the response deadline", async () => {
        adminState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                response_deadline: "2026-03-26",
                listings: {
                    id: "listing-1",
                    business_name: "Cafe Uno",
                    owner_id: "owner-1",
                },
            },
            error: null,
        });
        adminState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await updateCheck(
            new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                method: "PUT",
                body: JSON.stringify({ action: "extend" }),
            }),
            { params: Promise.resolve({ id: "check-1" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            action: "extended",
            new_deadline: "2026-04-02",
        });
        expect(adminState.calls.update).toContainEqual({ response_deadline: "2026-04-02" });
        expect(adminState.calls.insert).toContainEqual(
            expect.objectContaining({
                user_id: "owner-1",
                type: "annual_check",
                title: "Annual Check Extended",
            })
        );
    });

    it("PUT deactivate archives the listing state, creates a fee, cancels subscriptions, and notifies the owner", async () => {
        adminState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                response_deadline: "2026-03-26",
                listings: {
                    id: "listing-1",
                    business_name: "Cafe Uno",
                    owner_id: "owner-1",
                    is_active: true,
                },
            },
            error: null,
        });
        adminState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await updateCheck(
            new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                method: "PUT",
                body: JSON.stringify({ action: "deactivate" }),
            }),
            { params: Promise.resolve({ id: "check-1" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({ success: true, action: "deactivated" });
        expect(adminState.calls.update).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: "deactivated" }),
                expect.objectContaining({ is_active: false }),
                expect.objectContaining({ status: "cancelled", end_date: expect.any(String) }),
            ])
        );
        expect(adminState.calls.insert).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    listing_id: "listing-1",
                    annual_check_id: "check-1",
                    status: "pending",
                }),
                expect.objectContaining({
                    user_id: "owner-1",
                    type: "listing_deactivated",
                    title: "Listing Deactivated",
                }),
            ])
        );
    });

    it("PUT send_reminder creates a reminder notification and admin note", async () => {
        adminState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                response_deadline: "2026-03-30",
                listings: {
                    id: "listing-1",
                    business_name: "Cafe Uno",
                    owner_id: "owner-1",
                },
            },
            error: null,
        });
        adminState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await updateCheck(
            new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                method: "PUT",
                body: JSON.stringify({ action: "send_reminder" }),
            }),
            { params: Promise.resolve({ id: "check-1" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({ success: true, action: "reminder_sent" });
        expect(adminState.calls.insert).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    user_id: "owner-1",
                    type: "annual_check_reminder",
                    title: "Reminder: Annual Check Due",
                }),
                expect.objectContaining({
                    user_id: "owner-1",
                    admin_id: "admin-1",
                    note: expect.stringContaining("[REMINDER SENT]"),
                }),
            ])
        );
    });

    it("POST /batch-trigger creates pending checks and notifications for eligible listings", async () => {
        adminState.thenQueue.push(
            {
                data: [
                    { id: "listing-1", business_name: "Cafe Uno", owner_id: "owner-1", last_verified_at: null },
                    { id: "listing-2", business_name: "Studio Two", owner_id: null, last_verified_at: null },
                ],
                error: null,
            },
            {
                data: [],
                error: null,
            },
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await batchTrigger(
            new NextRequest("http://localhost/api/admin/annual-checks/batch-trigger", { method: "POST" })
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            triggered: 2,
            owners_notified: 1,
            pre_populated_flagged: 1,
        });
        expect(adminState.calls.insert[0]).toHaveLength(2);
        expect(adminState.calls.insert[1]).toHaveLength(1);
    });

    it("business owner POST operating confirms the listing and notifies admins", async () => {
        businessState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                status: "pending",
                listings: {
                    owner_id: "owner-1",
                    business_name: "Cafe Uno",
                },
            },
            error: null,
        });
        adminState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await postBusinessAnnualCheck(
            new NextRequest("http://localhost/api/business/annual-check", {
                method: "POST",
                body: JSON.stringify({ check_id: "check-1", response: "operating" }),
            })
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            message: "Listing verified successfully.",
        });
        expect(adminState.calls.update).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: "confirmed" }),
                expect.objectContaining({ last_verified_at: expect.any(String) }),
            ])
        );
        expect(adminState.calls.insert).toContainEqual(
            expect.objectContaining({
                type: "annual_check_resolved",
                title: "Business Re-verified",
            })
        );
    });

    it("business owner POST closed leaves the check pending and alerts admins", async () => {
        businessState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                status: "pending",
                listings: {
                    owner_id: "owner-1",
                    business_name: "Cafe Uno",
                },
            },
            error: null,
        });
        adminState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await postBusinessAnnualCheck(
            new NextRequest("http://localhost/api/business/annual-check", {
                method: "POST",
                body: JSON.stringify({ check_id: "check-1", response: "closed" }),
            })
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            message: "Report submitted. Amin will review and deactivate the listing.",
        });
        expect(adminState.calls.insert).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "annual_check_closure",
                    title: "Business Reported Closed",
                }),
                expect.objectContaining({
                    note: expect.stringContaining('Owner reported listing "Cafe Uno" as closed.'),
                }),
            ])
        );
    });

    it("GET /api/admin/annual-checks/stats returns the current annual-check metrics", async () => {
        adminState.thenQueue.push(
            { count: 6, error: null },
            { count: 4, error: null },
            { count: 1, error: null },
            { count: 3, error: null },
            { count: 2, error: null },
            {
                data: [
                    {
                        sent_at: "2026-03-01T12:00:00.000Z",
                        responded_at: "2026-03-04T12:00:00.000Z",
                    },
                ],
                error: null,
            },
            { count: 1, error: null },
            { count: 10, error: null },
            { count: 4, error: null }
        );

        const response = await getAnnualCheckStats(
            new NextRequest("http://localhost/api/admin/annual-checks/stats")
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            due_for_check: 5,
            pending_response: 4,
            past_deadline: 1,
            confirmed_this_month: 3,
            deactivated_this_month: 2,
            average_response_time_days: 3,
            response_rate_percent: 40,
        });
    });
});
