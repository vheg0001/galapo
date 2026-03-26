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
        singleQueue: [] as any[],
        maybeSingleQueue: [] as any[],
        calls: {
            from: [] as string[],
            eq: [] as any[],
            or: [] as any[],
            range: [] as any[],
            update: [] as any[],
            insert: [] as any[],
            delete: [] as any[],
            in: [] as any[],
            gte: [] as any[],
            lte: [] as any[],
            order: [] as any[],
        },
    };

    const chain: any = {};

    [
        "select",
        "eq",
        "or",
        "range",
        "in",
        "gte",
        "lte",
        "order",
        "lt",
        "is",
        "limit",
        "neq",
    ].forEach((name) => {
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

    chain.delete = vi.fn(() => {
        state.calls.delete.push(true);
        return chain;
    });

    chain.single = vi.fn(() => Promise.resolve(state.singleQueue.shift() ?? { data: null, error: null }));
    chain.maybeSingle = vi.fn(() => Promise.resolve(state.maybeSingleQueue.shift() ?? { data: null, error: null }));
    chain.then = vi.fn((resolve: any, reject: any) =>
        Promise.resolve(state.thenQueue.shift() ?? { data: [], error: null, count: 0 }).then(resolve, reject)
    );

    const client: any = {
        from: vi.fn((table: string) => {
            state.calls.from.push(table);
            return chain;
        }),
        auth: {
            resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
            admin: {
                deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
            },
        },
    };

    const requireAdmin = vi.fn().mockResolvedValue({
        user: { id: "admin-1" },
        profile: { id: "admin-1", role: "super_admin", is_active: true },
    });

    const reset = () => {
        state.thenQueue = [];
        state.singleQueue = [];
        state.maybeSingleQueue = [];
        state.calls = {
            from: [],
            eq: [],
            or: [],
            range: [],
            update: [],
            insert: [],
            delete: [],
            in: [],
            gte: [],
            lte: [],
            order: [],
        };

        Object.values(chain).forEach((fn: any) => fn?.mockClear?.());
        client.from.mockClear();
        client.auth.resetPasswordForEmail.mockClear();
        client.auth.admin.deleteUser.mockClear();
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

import { GET as getUsers } from "@/app/api/admin/users/route";
import { GET as getUserById, PUT as updateUserById } from "@/app/api/admin/users/[id]/route";
import { GET as getNotes, POST as postNote } from "@/app/api/admin/users/[id]/notes/route";
import { POST as sendEmail } from "@/app/api/admin/users/[id]/send-email/route";
import { GET as getStats } from "@/app/api/admin/users/stats/route";

describe("Admin Users API Integration", () => {
    beforeEach(() => {
        resetMockState();
    });

    it("returns 403 for non-admin requests", async () => {
        const forbidden = new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        const calls = [
            () => getUsers(new NextRequest("http://localhost/api/admin/users")),
            () => getUserById(new NextRequest("http://localhost/api/admin/users/user-1"), { params: Promise.resolve({ id: "user-1" }) }),
            () => updateUserById(
                new NextRequest("http://localhost/api/admin/users/user-1", {
                    method: "PUT",
                    body: JSON.stringify({ action: "toggle_active", is_active: false }),
                }),
                { params: Promise.resolve({ id: "user-1" }) }
            ),
            () => getNotes(new NextRequest("http://localhost/api/admin/users/user-1/notes"), { params: Promise.resolve({ id: "user-1" }) }),
            () => postNote(
                new NextRequest("http://localhost/api/admin/users/user-1/notes", {
                    method: "POST",
                    body: JSON.stringify({ note: "test" }),
                }),
                { params: Promise.resolve({ id: "user-1" }) }
            ),
            () => sendEmail(
                new NextRequest("http://localhost/api/admin/users/user-1/send-email", {
                    method: "POST",
                    body: JSON.stringify({ subject: "Hello", body: "Body" }),
                }),
                { params: Promise.resolve({ id: "user-1" }) }
            ),
            () => getStats(new NextRequest("http://localhost/api/admin/users/stats")),
        ];

        for (const invoke of calls) {
            mockRequireAdmin.mockResolvedValueOnce({ error: forbidden } as any);
            const response = await invoke();
            expect(response.status).toBe(403);
        }
    });

    it("GET /api/admin/users returns paginated users with derived stats", async () => {
        mockState.thenQueue.push(
            {
                data: [
                    {
                        id: "user-1",
                        full_name: "Ada Lovelace",
                        email: "ada@example.com",
                        phone: "09171234567",
                        is_active: true,
                        created_at: "2026-03-01T12:00:00.000Z",
                        avatar_url: null,
                    },
                ],
                error: null,
                count: 1,
            },
            {
                data: [
                    { id: "listing-1", owner_id: "user-1" },
                    { id: "listing-2", owner_id: "user-1" },
                ],
                error: null,
            },
            {
                data: [
                    {
                        listing_id: "listing-2",
                        status: "active",
                        plan_type: "premium",
                        created_at: "2026-03-02T12:00:00.000Z",
                    },
                ],
                error: null,
            },
            {
                data: [
                    { user_id: "user-1", amount: 1200 },
                    { user_id: "user-1", amount: 300 },
                ],
                error: null,
            },
            {
                data: [
                    { listing_id: "listing-1", created_at: "2026-03-20T12:00:00.000Z" },
                ],
                error: null,
            },
            { count: 5, error: null },
            { count: 2, error: null },
            { count: 3, error: null },
            { count: 1, error: null }
        );

        const response = await getUsers(
            new NextRequest("http://localhost/api/admin/users?search=ada&status=active&page=2&limit=1")
        );

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json.data).toHaveLength(1);
        expect(json.data[0]).toMatchObject({
            id: "user-1",
            listing_count: 2,
            total_payments: 1500,
            subscription_plan: "premium",
            active_subscriptions: 1,
        });
        expect(json.pagination).toMatchObject({ total: 1, page: 2, limit: 1 });
        expect(json.stats).toMatchObject({ total: 5, this_month: 2, with_subscriptions: 3, with_pending: 1 });
        expect(mockState.calls.or.some((args) => String(args[0]).includes("full_name.ilike.%ada%"))).toBe(true);
        expect(mockState.calls.eq.some((args) => args[0] === "is_active" && args[1] === true)).toBe(true);
        expect(mockState.calls.range.some((args) => args[0] === 1 && args[1] === 1)).toBe(true);
    });

    it("GET /api/admin/users/[id] returns the full user detail payload", async () => {
        mockState.singleQueue.push({
            data: {
                id: "user-1",
                full_name: "Jamie Santos",
                email: "jamie@example.com",
                phone: "09170000000",
                updated_at: "2026-03-22T12:00:00.000Z",
            },
            error: null,
        });

        mockState.thenQueue.push(
            {
                data: [
                    {
                        id: "listing-1",
                        business_name: "Cafe Uno",
                        slug: "cafe-uno",
                        created_at: "2026-03-01T12:00:00.000Z",
                        is_active: true,
                        is_premium: true,
                        is_featured: false,
                    },
                ],
                error: null,
            },
            {
                data: [
                    {
                        id: "note-1",
                        note: "Needs follow-up",
                        created_at: "2026-03-05T12:00:00.000Z",
                        profiles: { full_name: "Admin One" },
                    },
                ],
                error: null,
            },
            {
                data: [
                    {
                        id: "sub-1",
                        plan_type: "premium",
                        status: "active",
                        start_date: "2026-03-01T12:00:00.000Z",
                        end_date: "2026-03-31T12:00:00.000Z",
                        listings: { business_name: "Cafe Uno" },
                    },
                ],
                error: null,
            },
            {
                data: [
                    {
                        id: "pay-1",
                        amount: 800,
                        status: "verified",
                        payment_method: "gcash",
                        created_at: "2026-03-06T12:00:00.000Z",
                        description: "Subscription payment",
                        listings: { business_name: "Cafe Uno" },
                    },
                ],
                error: null,
            },
            {
                data: [
                    {
                        id: "log-1",
                        event_type: "view",
                        listing_id: "listing-1",
                        created_at: "2026-03-20T12:00:00.000Z",
                    },
                ],
                error: null,
            }
        );

        const response = await getUserById(
            new NextRequest("http://localhost/api/admin/users/user-1"),
            { params: Promise.resolve({ id: "user-1" }) }
        );

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json.profile).toMatchObject({ id: "user-1", email: "jamie@example.com" });
        expect(json.listings[0]).toMatchObject({ business_name: "Cafe Uno", plan: "premium" });
        expect(json.subscriptions[0]).toMatchObject({ listing_name: "Cafe Uno", plan: "premium" });
        expect(json.payments[0]).toMatchObject({ amount: 800, description: "Subscription payment" });
        expect(json.admin_notes[0]).toMatchObject({ admin_name: "Admin One", note: "Needs follow-up" });
        expect(json.activity_log[0]).toMatchObject({ type: "view", description: "Listing interaction" });
        expect(json.stats).toMatchObject({ total_listings: 1, active_listings: 1, total_payments_verified: 1, total_spent: 800 });
    });

    it("PUT toggle_active updates the selected user", async () => {
        mockState.singleQueue.push({
            data: { id: "user-2", is_active: false },
            error: null,
        });

        const response = await updateUserById(
            new NextRequest("http://localhost/api/admin/users/user-2", {
                method: "PUT",
                body: JSON.stringify({ action: "toggle_active", is_active: false }),
            }),
            { params: Promise.resolve({ id: "user-2" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            profile: { id: "user-2", is_active: false },
        });
        expect(mockState.calls.update).toContainEqual(
            expect.objectContaining({ is_active: false })
        );
    });

    it("PUT reset_password triggers the Supabase password reset email", async () => {
        mockState.singleQueue.push({
            data: { email: "target@example.com" },
            error: null,
        });

        const response = await updateUserById(
            new NextRequest("http://localhost/api/admin/users/user-2", {
                method: "PUT",
                body: JSON.stringify({ action: "reset_password" }),
            }),
            { params: Promise.resolve({ id: "user-2" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            message: "Password reset email sent",
        });
        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("target@example.com");
    });

    it("PUT delete with keep unassigns listings before deleting the user", async () => {
        mockState.thenQueue.push({ data: null, error: null });

        const response = await updateUserById(
            new NextRequest("http://localhost/api/admin/users/user-2", {
                method: "PUT",
                body: JSON.stringify({ action: "delete", listing_action: "keep" }),
            }),
            { params: Promise.resolve({ id: "user-2" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({ success: true, message: "User deleted" });
        expect(mockState.calls.update).toContainEqual({ owner_id: null });
        expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith("user-2");
    });

    it("PUT delete with delete removes the user's listings and account", async () => {
        mockState.thenQueue.push({ data: null, error: null });

        const response = await updateUserById(
            new NextRequest("http://localhost/api/admin/users/user-2", {
                method: "PUT",
                body: JSON.stringify({ action: "delete", listing_action: "delete" }),
            }),
            { params: Promise.resolve({ id: "user-2" }) }
        );

        expect(response.status).toBe(200);
        expect(mockState.calls.delete).toHaveLength(1);
        expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith("user-2");
    });

    it("POST /send-email records the outgoing message for the target user", async () => {
        mockState.singleQueue.push({
            data: { email: "jamie@example.com", full_name: "Jamie Santos" },
            error: null,
        });
        mockState.thenQueue.push({ data: null, error: null });

        const response = await sendEmail(
            new NextRequest("http://localhost/api/admin/users/user-1/send-email", {
                method: "POST",
                body: JSON.stringify({ subject: "Hello", body: "Thanks for updating your profile." }),
            }),
            { params: Promise.resolve({ id: "user-1" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            message: "Email delivered to jamie@example.com",
        });
        expect(mockState.calls.insert).toContainEqual(
            expect.objectContaining({
                user_id: "user-1",
                admin_id: "admin-1",
                note: expect.stringContaining("[EMAIL SENT] Subject: Hello"),
            })
        );
    });

    it("admin notes GET and POST support note history and note creation", async () => {
        mockState.thenQueue.push({
            data: [{ id: "note-1", note: "Existing note" }],
            error: null,
        });

        const listResponse = await getNotes(
            new NextRequest("http://localhost/api/admin/users/user-1/notes"),
            { params: Promise.resolve({ id: "user-1" }) }
        );

        expect(listResponse.status).toBe(200);
        await expect(listResponse.json()).resolves.toEqual([{ id: "note-1", note: "Existing note" }]);

        mockState.singleQueue.push({
            data: { id: "note-2", note: "Created note" },
            error: null,
        });

        const createResponse = await postNote(
            new NextRequest("http://localhost/api/admin/users/user-1/notes", {
                method: "POST",
                body: JSON.stringify({ note: "Created note" }),
            }),
            { params: Promise.resolve({ id: "user-1" }) }
        );

        expect(createResponse.status).toBe(200);
        await expect(createResponse.json()).resolves.toMatchObject({ id: "note-2", note: "Created note" });
        expect(mockState.calls.insert).toContainEqual(
            expect.objectContaining({
                user_id: "user-1",
                admin_id: "admin-1",
                note: "Created note",
            })
        );
    });

    it("GET /api/admin/users/stats returns aggregate dashboard metrics", async () => {
        mockState.thenQueue.push(
            { count: 10, error: null },
            { count: 3, error: null },
            { count: 8, error: null },
            { count: 6, error: null },
            { count: 2, error: null },
            {
                data: [
                    { created_at: "2026-01-10T12:00:00.000Z" },
                    { created_at: "2026-02-14T12:00:00.000Z" },
                    { created_at: "2026-03-20T12:00:00.000Z" },
                ],
                error: null,
            }
        );

        const response = await getStats(new NextRequest("http://localhost/api/admin/users/stats"));

        expect(response.status).toBe(200);
        const json = await response.json();

        expect(json).toMatchObject({
            total_registered: 10,
            registered_this_month: 3,
            active_users: 8,
            with_subscriptions: 6,
            with_pending_listings: 2,
        });
        expect(json.registration_trend).toHaveLength(6);
    });
});
