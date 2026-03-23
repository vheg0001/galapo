import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// We need a way to return a thenable from queries, but keep the client non-thenable
const createMockSupabase = () => {
    const queryChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: [], error: null, count: 0 })),
    };

    const client = {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
            signInWithPassword: vi.fn(),
            updateUser: vi.fn(),
        },
        from: vi.fn(() => queryChain),
        // Chaining helper for tests
        _queryChain: queryChain,
    };

    return client;
};

const mockSupabase = createMockSupabase();

vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
    createAdminSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import { GET as getStats } from "@/app/api/business/dashboard/stats/route";
import { GET as getListings } from "@/app/api/business/listings/route";
import { PUT as updateProfile } from "@/app/api/business/profile/route";

describe("Business Dashboard API Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
        mockSupabase._queryChain.then.mockImplementation((resolve: any) => resolve({ data: [], error: null, count: 0 }));
    });

    it("GET /api/business/dashboard/stats returns stats", async () => {
        mockSupabase._queryChain.then
            .mockImplementationOnce((resolve: any) => resolve({ data: [{ id: "l1" }], error: null }))
            .mockImplementationOnce((resolve: any) => resolve({ data: [{ event_type: "page_view" }], error: null }))
            .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }))
            .mockImplementationOnce((resolve: any) => resolve({ count: 1, error: null }))
            .mockImplementationOnce((resolve: any) => resolve({ count: 1, error: null }));

        const res = await getStats();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.total_listings).toBe(1);
    });

    it("GET /api/business/listings returns listings", async () => {
        mockSupabase._queryChain.then
            .mockImplementationOnce((resolve: any) => resolve({
                data: [{ id: "l1", business_name: "My Shop", slug: "my-shop" }],
                count: 1,
                error: null
            }))
            .mockImplementationOnce((resolve: any) => resolve({ data: [], error: null }));

        const req = new NextRequest("http://localhost/api/business/listings?page=1&limit=10");
        const res = await getListings(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data).toHaveLength(1);
    });

    it("PUT /api/business/profile updates data", async () => {
        mockSupabase._queryChain.then.mockImplementationOnce((resolve: any) =>
            resolve({ data: { full_name: "New Name" }, error: null })
        );

        const req = new NextRequest("http://localhost/api/business/profile", {
            method: "PUT",
            body: JSON.stringify({ full_name: "New Name" }),
        });
        const res = await updateProfile(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.full_name).toBe("New Name");
    });
});
