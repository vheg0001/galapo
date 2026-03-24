import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockSupabase, mockRequireAdmin, resetMockState, mockState } = vi.hoisted(() => {
    const state = {
        thenQueue: [] as any[],
        singleQueue: [] as any[],
        maybeSingleQueue: [] as any[],
        calls: {
            from: [] as any[],
            eq: [] as any[],
            or: [] as any[],
            range: [] as any[],
            insert: [] as any[],
            update: [] as any[],
        },
    };

    const chain: any = {};

    const chainMethods = [
        "select",
        "eq",
        "ilike",
        "order",
        "range",
        "gte",
        "lte",
        "or",
        "in",
        "not",
        "is",
        "limit",
        "delete",
        "neq",
    ];

    chainMethods.forEach((name) => {
        chain[name] = vi.fn((...args: any[]) => {
            if (name in state.calls) (state.calls as any)[name].push(args);
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
    chain.maybeSingle = vi.fn(() => Promise.resolve(state.maybeSingleQueue.shift() ?? { data: null, error: null }));
    chain.then = vi.fn((resolve: any, reject: any) =>
        Promise.resolve(state.thenQueue.shift() ?? { data: [], error: null, count: 0 }).then(resolve, reject)
    );

    const mockClient: any = {
        from: vi.fn((table: string) => {
            state.calls.from.push(table);
            return chain;
        }),
        storage: {
            from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        },
    };

    const requireAdmin = vi.fn().mockResolvedValue({
        userId: "admin-1",
        session: { user: { id: "admin-1" } },
        adminClient: mockClient,
    });

    const reset = () => {
        state.thenQueue = [];
        state.singleQueue = [];
        state.maybeSingleQueue = [];
        state.calls = { from: [], eq: [], or: [], range: [], insert: [], update: [] };
        Object.values(chain).forEach((fn: any) => fn?.mockClear?.());
        mockClient.from.mockClear();
        mockClient.storage.from.mockClear();
        requireAdmin.mockReset();
        requireAdmin.mockResolvedValue({
            userId: "admin-1",
            session: { user: { id: "admin-1" } },
            adminClient: mockClient,
        });
    };

    return { mockSupabase: mockClient, mockRequireAdmin: requireAdmin, resetMockState: reset, mockState: state };
});

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/listing-helpers", () => ({
    generateUniqueSlug: vi.fn(() => "cafe-uno-2"),
}));

import { GET as getListings, POST as postListing } from "@/app/api/admin/listings/route";
import { GET as getCounts } from "@/app/api/admin/listings/counts/route";
import { GET as getListingById, PUT as putListingById } from "@/app/api/admin/listings/[id]/route";
import { POST as approveListing } from "@/app/api/admin/listings/[id]/approve/route";
import { POST as rejectListing } from "@/app/api/admin/listings/[id]/reject/route";
import { POST as bulkAction } from "@/app/api/admin/listings/bulk/route";
import { GET as getNotes, POST as postNote } from "@/app/api/admin/listings/[id]/notes/route";
import { POST as assignOwner } from "@/app/api/admin/listings/[id]/assign-owner/route";
import { GET as getAnalytics } from "@/app/api/admin/listings/[id]/analytics/route";
import { PUT as updateClaim } from "@/app/api/admin/claims/[id]/route";

describe("Admin Listings API Integration", () => {
    beforeEach(() => {
        resetMockState();
    });

    it("returns 403 for non-admin on all endpoints", async () => {
        const forbidden = new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

        const invocations = [
            () => getListings(new NextRequest("http://localhost/api/admin/listings")),
            () => postListing(new NextRequest("http://localhost/api/admin/listings", { method: "POST", body: "{}" })),
            () => getCounts(new NextRequest("http://localhost/api/admin/listings/counts")),
            () => getListingById(new NextRequest("http://localhost/api/admin/listings/l1"), { params: Promise.resolve({ id: "l1" }) }),
            () => putListingById(new NextRequest("http://localhost/api/admin/listings/l1", { method: "PUT", body: "{}" }), { params: Promise.resolve({ id: "l1" }) }),
            () => approveListing(new NextRequest("http://localhost/api/admin/listings/l1/approve", { method: "POST" }), { params: Promise.resolve({ id: "l1" }) }),
            () => rejectListing(new NextRequest("http://localhost/api/admin/listings/l1/reject", { method: "POST", body: JSON.stringify({ reason: "x" }) }), { params: Promise.resolve({ id: "l1" }) }),
            () => bulkAction(new NextRequest("http://localhost/api/admin/listings/bulk", { method: "POST", body: JSON.stringify({ listing_ids: ["l1"], action: "approve" }) })),
            () => getNotes(new NextRequest("http://localhost/api/admin/listings/l1/notes"), { params: Promise.resolve({ id: "l1" }) }),
            () => postNote(new NextRequest("http://localhost/api/admin/listings/l1/notes", { method: "POST", body: JSON.stringify({ note: "x" }) }), { params: Promise.resolve({ id: "l1" }) }),
            () => assignOwner(new NextRequest("http://localhost/api/admin/listings/l1/assign-owner", { method: "POST", body: JSON.stringify({ owner_id: "u1" }) }), { params: Promise.resolve({ id: "l1" }) }),
            () => getAnalytics(new NextRequest("http://localhost/api/admin/listings/l1/analytics"), { params: Promise.resolve({ id: "l1" }) }),
            () => updateClaim(new NextRequest("http://localhost/api/admin/claims/l1", { method: "PUT", body: JSON.stringify({ action: "approve" }) }), { params: Promise.resolve({ id: "l1" }) }),
        ];

        for (const invoke of invocations) {
            mockRequireAdmin.mockResolvedValueOnce({ error: forbidden } as any);
            const res = await invoke();
            expect(res!.status).toBe(403);
        }
    });

    it("GET /api/admin/listings returns listings with filters payload", async () => {
        mockState.thenQueue.push(
            {
                data: [
                    {
                        id: "l1",
                        business_name: "Cafe Uno",
                        status: "pending",
                        is_active: true,
                        is_featured: false,
                        is_premium: false,
                        categories: { name: "Food" },
                        subcategory: { name: "Cafe" },
                        barangays: { name: "Barretto" },
                        profiles: { full_name: "Owner One", email: "owner@x.com" },
                    },
                ],
                count: 1,
                error: null,
            },
            { data: [{ status: "pending", is_active: true }], error: null },
            { data: [{ listing_id: "l1" }, { listing_id: "l1" }], error: null }
        );

        const res = await getListings(new NextRequest("http://localhost/api/admin/listings?status=all"));
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.data).toHaveLength(1);
        expect(json.data[0].views_count).toBe(2);
        expect(json.counts.pending).toBe(1);
    });

    it("GET with status=pending applies status filtering", async () => {
        mockState.thenQueue.push(
            { data: [{ id: "l1", status: "pending" }], count: 1, error: null },
            { data: [{ status: "pending", is_active: true }], error: null },
            { data: [], error: null }
        );
        const res = await getListings(new NextRequest("http://localhost/api/admin/listings?status=pending"));
        expect(res!.status).toBe(200);
        expect(mockState.calls.eq.some((args) => args[0] === "status" && args[1] === "pending")).toBe(true);
    });

    it("GET with search filters correctly", async () => {
        mockState.thenQueue.push(
            { data: [{ id: "l1", business_name: "Cafe Uno" }], count: 1, error: null },
            { data: [{ status: "approved", is_active: true }], error: null },
            { data: [], error: null }
        );
        const res = await getListings(new NextRequest("http://localhost/api/admin/listings?search=cafe"));
        expect(res!.status).toBe(200);
        expect(mockState.calls.or.some((args) => String(args[0]).includes("business_name.ilike.%cafe%"))).toBe(true);
    });

    it("GET with pagination uses expected range", async () => {
        mockState.thenQueue.push(
            { data: [{ id: "l1" }], count: 21, error: null },
            { data: [{ status: "approved", is_active: true }], error: null },
            { data: [], error: null }
        );
        const res = await getListings(new NextRequest("http://localhost/api/admin/listings?page=2&limit=10"));
        expect(res!.status).toBe(200);
        expect(mockState.calls.range.some((args) => args[0] === 10 && args[1] === 19)).toBe(true);
    });

    it("GET /api/admin/listings/counts returns counts", async () => {
        mockState.thenQueue.push(
            { count: 1, error: null },
            { count: 2, error: null },
            { count: 3, error: null },
            { count: 4, error: null },
            { count: 5, error: null },
            { count: 15, error: null },
            { count: 10, error: null },
            { count: 5, error: null }
        );
        const res = await getCounts(new NextRequest("http://localhost/api/admin/listings/counts"));
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.pending).toBe(1);
        expect(json.total).toBe(15);
        expect(json.active).toBe(10);
    });

    it("POST /api/admin/listings creates listing with admin extras", async () => {
        mockState.thenQueue.push({ data: [{ slug: "cafe-uno" }], error: null });
        mockState.singleQueue.push({ data: { id: "l1", slug: "cafe-uno-2", is_pre_populated: true }, error: null });

        const req = new NextRequest("http://localhost/api/admin/listings", {
            method: "POST",
            body: JSON.stringify({
                business_name: "Cafe Uno",
                category_id: "cat-1",
                address: "123 Harbor",
            }),
        });
        const res = await postListing(req);
        expect(res!.status).toBe(201);
        expect(mockState.calls.insert[0]).toMatchObject({
            business_name: "Cafe Uno",
            slug: "cafe-uno-2",
            status: "approved",
            is_pre_populated: true,
        });
    });

    it("GET /api/admin/listings/[id] returns full detail", async () => {
        mockState.singleQueue.push({
            data: {
                id: "l1",
                status: "claimed_pending",
                owner_id: "u1",
                profiles: { id: "u1", full_name: "Owner One" },
            },
            error: null,
        });
        mockState.thenQueue.push(
            { data: [{ id: "img1" }], error: null },
            { data: [{ id: "field1" }], error: null },
            { data: [{ id: "deal1" }], error: null },
            { data: [{ id: "event1" }], error: null },
            { data: [{ id: "payment1" }], error: null },
            { data: [{ event_type: "page_view", created_at: new Date().toISOString() }], error: null },
            { data: [{ id: "note1", note: "test note" }], error: null },
            { count: 3, error: null }
        );
        mockState.maybeSingleQueue.push({ data: { id: "sub1", plan_type: "premium" }, error: null });

        const res = await getListingById(new NextRequest("http://localhost/api/admin/listings/l1"), {
            params: Promise.resolve({ id: "l1" }),
        });
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.images).toHaveLength(1);
        expect(json.dynamic_field_values).toHaveLength(1);
        expect(json.current_subscription).toBeTruthy();
        expect(json.analytics_summary.total_views).toBe(1);
    });

    it("PUT /api/admin/listings/[id] updates listing without forcing re-approval", async () => {
        mockState.singleQueue.push({
            data: { id: "l1", status: "approved", short_description: "Updated copy" },
            error: null,
        });
        mockState.thenQueue.push({ data: null, error: null });

        const req = new NextRequest("http://localhost/api/admin/listings/l1", {
            method: "PUT",
            body: JSON.stringify({ short_description: "Updated copy" }),
        });
        const res = await putListingById(req, { params: Promise.resolve({ id: "l1" }) });
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.data.status).toBe("approved");
        expect(mockState.calls.update[0]).toMatchObject({ short_description: "Updated copy" });
    });

    it("POST /api/admin/listings/[id]/approve approves and creates notification", async () => {
        mockState.singleQueue.push(
            { data: { id: "l1", status: "pending", owner_id: "u1", business_name: "Cafe Uno" }, error: null },
            { data: { id: "l1", status: "approved" }, error: null }
        );
        mockState.thenQueue.push({ data: null, error: null }, { data: null, error: null });

        const res = await approveListing(
            new NextRequest("http://localhost/api/admin/listings/l1/approve", { method: "POST" }),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.listing.status).toBe("approved");
        expect(mockState.calls.insert.some((x) => x?.type === "listing_approved")).toBe(true);
    });

    it("POST /api/admin/listings/[id]/reject rejects and stores reason and notification", async () => {
        mockState.singleQueue.push(
            { data: { id: "l1", status: "pending", owner_id: "u1", business_name: "Cafe Uno" }, error: null },
            { data: { id: "l1", status: "rejected", rejection_reason: "Invalid docs" }, error: null }
        );
        mockState.thenQueue.push({ data: null, error: null }, { data: null, error: null });

        const res = await rejectListing(
            new NextRequest("http://localhost/api/admin/listings/l1/reject", {
                method: "POST",
                body: JSON.stringify({ reason: "Invalid docs" }),
            }),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.listing.rejection_reason).toBe("Invalid docs");
        expect(mockState.calls.insert.some((x) => x?.type === "listing_rejected")).toBe(true);
    });

    it("POST /api/admin/listings/bulk approves multiple listings", async () => {
        mockState.singleQueue.push(
            { data: { id: "l1", business_name: "A", owner_id: null }, error: null },
            { data: { id: "l2", business_name: "B", owner_id: null }, error: null }
        );
        mockState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null }
        );

        const res = await bulkAction(
            new NextRequest("http://localhost/api/admin/listings/bulk", {
                method: "POST",
                body: JSON.stringify({ listing_ids: ["l1", "l2"], action: "approve" }),
            })
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.success_count).toBe(2);
        expect(json.failed_count).toBe(0);
    });

    it("POST /api/admin/listings/bulk rejects multiple listings with reason", async () => {
        mockState.singleQueue.push(
            { data: { id: "l1", business_name: "A", owner_id: null }, error: null },
            { data: { id: "l2", business_name: "B", owner_id: null }, error: null }
        );
        mockState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null }
        );

        const res = await bulkAction(
            new NextRequest("http://localhost/api/admin/listings/bulk", {
                method: "POST",
                body: JSON.stringify({ listing_ids: ["l1", "l2"], action: "reject", reason: "Policy violation" }),
            })
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.success_count).toBe(2);
    });

    it("POST and GET notes endpoints create and return notes", async () => {
        mockState.singleQueue.push({
            data: { id: "n1", note: "Investigate duplicate", profiles: { full_name: "Admin One" } },
            error: null,
        });
        const postRes = await postNote(
            new NextRequest("http://localhost/api/admin/listings/l1/notes", {
                method: "POST",
                body: JSON.stringify({ note: "Investigate duplicate" }),
            }),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(postRes!.status).toBe(201);

        mockState.thenQueue.push({
            data: [{ id: "n1", note: "Investigate duplicate" }],
            error: null,
        });
        const getRes = await getNotes(new NextRequest("http://localhost/api/admin/listings/l1/notes"), {
            params: Promise.resolve({ id: "l1" }),
        });
        expect(getRes!.status).toBe(200);
        const json = await getRes!.json();
        expect(json.notes).toHaveLength(1);
    });

    it("POST /api/admin/listings/[id]/assign-owner updates owner", async () => {
        mockState.singleQueue.push(
            { data: { id: "u1", role: "business_owner", is_active: true }, error: null },
            { data: { id: "l1", business_name: "Cafe Uno" }, error: null },
            { data: { id: "l1", owner_id: "u1", is_pre_populated: false }, error: null }
        );
        mockState.thenQueue.push({ data: null, error: null }, { data: null, error: null });

        const res = await assignOwner(
            new NextRequest("http://localhost/api/admin/listings/l1/assign-owner", {
                method: "POST",
                body: JSON.stringify({ owner_id: "u1" }),
            }),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.listing.owner_id).toBe("u1");
    });

    it("GET /api/admin/listings/[id]/analytics returns computed stats", async () => {
        mockState.thenQueue.push({
            data: [
                { event_type: "page_view", created_at: "2026-03-01T00:00:00.000Z", event_data: { source: "google" } },
                { event_type: "phone_click", created_at: "2026-03-01T01:00:00.000Z", event_data: { source: "google" } },
                { event_type: "email_click", created_at: "2026-03-02T01:00:00.000Z", event_data: { source: "facebook" } },
            ],
            error: null,
        });
        const res = await getAnalytics(
            new NextRequest("http://localhost/api/admin/listings/l1/analytics?period=30d"),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.total_views).toBe(1);
        expect(json.total_clicks.phone).toBe(1);
        expect(json.total_clicks.email).toBe(1);
        expect(json.top_referrers[0].source).toBe("google");
    });

    it("PUT /api/admin/claims/[id] approve updates listing owner flow and notification", async () => {
        mockState.singleQueue.push({
            data: { id: "l1", business_name: "Cafe Uno", owner_id: "u1", status: "claimed_pending" },
            error: null,
        });
        mockState.thenQueue.push({ data: null, error: null }, { data: null, error: null });

        const res = await updateClaim(
            new NextRequest("http://localhost/api/admin/claims/l1", {
                method: "PUT",
                body: JSON.stringify({ action: "approve" }),
            }),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.action).toBe("approved");
        expect(mockState.calls.insert.some((x) => x?.type === "claim_approved")).toBe(true);
    });

    it("PUT /api/admin/claims/[id] reject clears claim and sends reason notification", async () => {
        mockState.singleQueue.push({
            data: { id: "l1", business_name: "Cafe Uno", owner_id: "u1", status: "claimed_pending" },
            error: null,
        });
        mockState.thenQueue.push({ data: null, error: null }, { data: null, error: null });

        const res = await updateClaim(
            new NextRequest("http://localhost/api/admin/claims/l1", {
                method: "PUT",
                body: JSON.stringify({ action: "reject", reason: "Unclear documents" }),
            }),
            { params: Promise.resolve({ id: "l1" }) }
        );
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.action).toBe("rejected");
        expect(mockState.calls.insert.some((x) => x?.type === "claim_rejected")).toBe(true);
    });
});
