import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { GET as getPlacements, POST as createPlacement } from "@/app/api/admin/top-search/route";
import { GET as getOverview } from "@/app/api/admin/top-search/overview/route";
import { GET as getPlacementDetail, PUT as updatePlacement, DELETE as deletePlacement } from "@/app/api/admin/top-search/[id]/route";
import { GET as getStats } from "@/app/api/admin/top-search/stats/route";
import { NextRequest, NextResponse } from "next/server";

// Mock auth helpers to bypass security checks in integration tests
vi.mock("@/lib/auth-helpers", () => ({
    requireAdmin: vi.fn(async () => ({ 
        user: { id: "u-1" }, 
        profile: { id: "u-1", role: "super_admin", is_active: true } 
    })),
    getServerSession: vi.fn(async () => ({ user: { id: "u-1" } })),
    getServerUser: vi.fn(async () => ({ id: "u-1" })),
}));

// Mock admin helpers
vi.mock("@/lib/admin-helpers", () => ({
    notifyOwner: vi.fn().mockResolvedValue({ success: true }),
}));

// Helper to create req
const createReq = (url: string, method = "GET", body?: any) => {
    return new NextRequest(new URL(url, "http://localhost"), {
        method,
        body: body ? JSON.stringify(body) : undefined,
    });
};

describe("Admin Top Search API Integration", () => {
    // Factory for fresh chain objects
    const createChain = () => {
        const chain: any = {
            _data: [] as any,
            _error: null as any,
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            lte: vi.fn(() => chain),
            gte: vi.fn(() => chain),
            lt: vi.fn(() => chain),
            in: vi.fn(() => chain),
            order: vi.fn(() => chain),
            range: vi.fn(() => chain),
            insert: vi.fn(() => chain),
            upsert: vi.fn(() => chain),
            update: vi.fn(() => chain),
            delete: vi.fn(() => chain),
            single: vi.fn(() => chain),
            maybeSingle: vi.fn(() => chain),
            // Proper thenable implementation
            then: vi.fn((onFulfilled, onRejected) => {
                return Promise.resolve({ data: chain._data, error: chain._error }).then(onFulfilled, onRejected);
            }),
            // Helper to set data
            mockResolvedValue: (val: any) => {
                chain._data = val.data;
                chain._error = val.error || null;
                return chain;
            },
            mockResolvedValueOnce: (val: any) => {
                chain._data = val.data;
                chain._error = val.error || null;
                return chain;
            }
        };
        return chain;
    };

    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        const mockAuth = {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "u-1" } } }, error: null }),
        };

        mockSupabase = {
            auth: mockAuth,
            from: vi.fn(() => createChain()),
        };

        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
        (createAdminSupabaseClient as any).mockReturnValue(mockSupabase);
    });

    it("GET /api/admin/top-search returns placements", async () => {
        const chain = createChain().mockResolvedValue({ data: [{ id: "p-1" }], count: 1 });
        mockSupabase.from.mockReturnValue(chain);

        const res = await getPlacements(createReq("/api/admin/top-search?status=active"));
        const json = await res!.json();

        expect(json.data).toHaveLength(1);
    });

    it("POST /api/admin/top-search handles manual assignment", async () => {
        const conflictChain = createChain().mockResolvedValue({ data: [] });
        const insertChain = createChain().mockResolvedValue({ data: { id: "new-p" } });
        const notificationChain = createChain();

        notificationChain.then
            .mockImplementationOnce((onFulfilled: any) => 
                Promise.resolve({ data: { id: "list-1", owner_id: "u-1" }, error: null }).then(onFulfilled))
            .mockImplementationOnce((onFulfilled: any) => 
                Promise.resolve({ data: { name: "Category 1" }, error: null }).then(onFulfilled));

        mockSupabase.from
            .mockReturnValueOnce(conflictChain)
            .mockReturnValueOnce(insertChain)
            .mockReturnValueOnce(notificationChain)
            .mockReturnValueOnce(notificationChain);

        const res = await createPlacement(createReq("/api/admin/top-search", "POST", {
            category_id: "cat-1",
            listing_id: "list-1",
            position: 1,
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
        }));
        const json = await res!.json();

        expect(json.success).toBe(true);
        expect(insertChain.insert).toHaveBeenCalled();
    });

    it("POST /api/admin/top-search blocks conflicts", async () => {
        const conflictChain = createChain().mockResolvedValue({ data: [{ id: "existing" }] });
        mockSupabase.from.mockReturnValue(conflictChain);

        const res = await createPlacement(createReq("/api/admin/top-search", "POST", {
            category_id: "cat-1",
            listing_id: "list-2",
            position: 1,
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
        }));
        
        expect(res!.status).toBe(409);
    });

    it("PUT /api/admin/top-search/[id] extends placement", async () => {
        const chain = createChain().mockResolvedValue({ data: { id: "p-1", end_date: new Date().toISOString() } });
        mockSupabase.from.mockReturnValue(chain);

        const res = await updatePlacement(
            createReq("/api/admin/top-search/p-1", "PUT", { action: "extend", days: 7 }),
            { params: Promise.resolve({ id: "p-1" }) }
        );

        expect(chain.update).toHaveBeenCalled();
    });

    it("DELETE /api/admin/top-search/[id] removes and cleans badges", async () => {
        const chain = createChain();
        // Return placement, then delete result, then listing badges result, then update result
        chain.then
            .mockImplementationOnce((onFulfilled: any) => Promise.resolve({ data: { listing_id: "list-1" }, error: null }).then(onFulfilled))
            .mockImplementationOnce((onFulfilled: any) => Promise.resolve({ error: null }).then(onFulfilled))
            .mockImplementationOnce((onFulfilled: any) => Promise.resolve({ data: { badges: ["sponsored"] }, error: null }).then(onFulfilled))
            .mockImplementationOnce((onFulfilled: any) => Promise.resolve({ error: null }).then(onFulfilled));

        mockSupabase.from.mockReturnValue(chain);

        const res = await deletePlacement(
            createReq("/api/admin/top-search/p-1", "DELETE"),
            { params: Promise.resolve({ id: "p-1" }) }
        );

        expect(chain.delete).toHaveBeenCalled();
        expect(chain.update).toHaveBeenCalled(); 
    });

    it("GET /api/admin/top-search/overview returns structured slots", async () => {
        const catChain = createChain().mockResolvedValue({ data: [{ id: "cat-1", name: "Food" }] });
        const placementChain = createChain().mockResolvedValue({ data: [] });

        mockSupabase.from
            .mockReturnValueOnce(catChain)
            .mockReturnValueOnce(placementChain);

        const res = await getOverview(createReq("/api/admin/top-search/overview"));
        const json = await res!.json();

        expect(json.data[0].slots).toHaveLength(3);
    });
});
