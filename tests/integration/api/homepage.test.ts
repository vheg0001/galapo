import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getFeatured } from "@/app/api/listings/featured/route";
import { GET as getLatest } from "@/app/api/listings/latest/route";
import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getEvents } from "@/app/api/events/upcoming/route";
import { GET as getDeals } from "@/app/api/deals/active/route";
import { GET as getBlog } from "@/app/api/blog/latest/route";
import { POST as postAdImpression } from "@/app/api/ads/route";
import { POST as postAdClick } from "@/app/api/ads/click/route";
import { createServerSupabaseClient } from "@/lib/supabase";

// Mock Supabase Client
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

// Helper logic for creating pseudo Request objects for App Router API tests
const mockRequest = (urlStr: string, method = "GET", body?: any) => {
    return new Request(urlStr, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) })
    });
};

describe("Homepage API Routes Integration", () => {
    let mockSupabase: any;

    beforeEach(() => {
        mockSupabase = {
            from: vi.fn(),
            rpc: vi.fn(),
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    });

    describe("GET /api/listings/featured", () => {
        it("returns featured listings", async () => {
            const mockData = [{ id: "1", business_name: "Featured Business" }];
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                then: vi.fn((cb) => cb({ data: mockData, error: null })),
            };
            mockSupabase.from.mockReturnValue(queryBuilder);

            const req = mockRequest("http://localhost:3000/api/listings/featured");
            const res = await getFeatured(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockData);
        });
    });

    describe("GET /api/categories", () => {
        it("returns nested categories with count", async () => {
            const mockCategories = [
                { id: "parent1", name: "Food", parent_id: null },
                { id: "child1", name: "Burger", parent_id: "parent1" }
            ];
            const mockListings = [
                { id: "l1", category_id: "child1" }
            ];

            const queryBuilderCats = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
                then: vi.fn((cb) => cb({ data: mockCategories, error: null })),
            };

            const queryBuilderListings = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: vi.fn((cb) => cb({ data: mockListings, error: null })),
            };

            // Setup mock responses based on the table queried
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === "categories") return queryBuilderCats;
                if (table === "listings") return queryBuilderListings;
                return {};
            });

            const req = mockRequest("http://localhost:3000/api/categories");
            const res = await getCategories(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            // Food should have 1 child (Burger) and listing count 1
            expect(json.data[0].listing_count).toBe(1);
            expect(json.data[0].subcategories).toHaveLength(1);
        });
    });

    describe("GET /api/events/upcoming", () => {
        it("returns upcoming events", async () => {
            const mockData = [{ id: "1", title: "Party" }];
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                then: vi.fn((cb) => cb({ data: mockData, error: null })),
            };
            mockSupabase.from.mockReturnValue(queryBuilder);

            const req = mockRequest("http://localhost:3000/api/events/upcoming");
            const res = await getEvents(req);
            const json = await res.json();

            expect(json.success).toBe(true);
            expect(json.data).toEqual(mockData);
        });
    });

    describe("POST /api/ads", () => {
        it("tracks ad impression via RPC", async () => {
            const { POST: postImpression } = await import("@/app/api/ads/route");
            mockSupabase.rpc.mockResolvedValue({ error: null });

            const req = mockRequest("http://localhost:3000/api/ads", "POST", { ad_id: "ad-123" });
            const res = await postImpression(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(mockSupabase.rpc).toHaveBeenCalledWith("increment_ad_impression", { ad_id: "ad-123" });
        });
    });

    describe("POST /api/ads/click", () => {
        it("tracks ad click via RPC", async () => {
            const { POST: postClick } = await import("@/app/api/ads/click/route");
            mockSupabase.rpc.mockResolvedValue({ error: null });

            const req = mockRequest("http://localhost:3000/api/ads/click", "POST", { ad_id: "ad-123" });
            const res = await postClick(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(mockSupabase.rpc).toHaveBeenCalledWith("increment_ad_click", { ad_id: "ad-123" });
        });

        it("fails on missing ad_id", async () => {
            const { POST: postClick } = await import("@/app/api/ads/click/route");
            const req = mockRequest("http://localhost:3000/api/ads/click", "POST", {});
            const res = await postClick(req);
            const json = await res.json();

            expect(res.status).toBe(400);
            expect(json.error).toContain("ad_id is required");
        });
    });
});
