import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getListings } from "@/app/api/listings/route";
import { GET as getMapListings } from "@/app/api/listings/map/route";
import { GET as getTopSearch } from "@/app/api/top-search/[category]/route";
import { GET as getCategoryBySlug } from "@/app/api/categories/[slug]/route";
import { createServerSupabaseClient } from "@/lib/supabase";

// Mock Supabase Client
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

const mockRequest = (urlStr: string) =>
    new Request(urlStr, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

describe("Category API Routes Integration", () => {
    let mockSupabase: any;

    const makeQueryBuilder = (data: any = [], extra: any = {}) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: data?.[0] || null, error: null }),
        then: vi.fn((cb) => cb({ data, count: data.length, error: null, ...extra })),
    });

    beforeEach(() => {
        mockSupabase = {
            from: vi.fn(),
            rpc: vi.fn(),
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    });

    // ─── GET /api/categories/[slug] ───────────────────────────
    describe("GET /api/categories/[slug]", () => {
        it("returns 404 for non-existent category", async () => {
            const qb = makeQueryBuilder([]);
            qb.maybeSingle.mockResolvedValue({ data: null, error: null });
            mockSupabase.from.mockReturnValue(qb);

            const req = mockRequest("http://localhost:3000/api/categories/nonexistent");
            const res = await getCategoryBySlug(req, {
                params: Promise.resolve({ slug: "nonexistent" }),
            });
            const json = await res.json();

            expect(res.status).toBe(404);
            expect(json.success).toBe(false);
        });

        it("returns parent category with subcategories", async () => {
            const parentCat = {
                id: "cat1", name: "Food", slug: "food", icon: "utensils",
                parent_id: null, description: null, is_active: true, sort_order: 1,
            };
            const subcats = [
                { id: "sub1", name: "Fast Food", slug: "fast-food", icon: null, sort_order: 1 },
            ];

            // First call: category lookup
            const qbCat = makeQueryBuilder([parentCat]);
            qbCat.maybeSingle.mockResolvedValue({ data: parentCat, error: null });

            // Subsequent calls: subcategories, listings, count, fields
            const qbSubs = makeQueryBuilder(subcats);
            const qbListings = makeQueryBuilder([{ subcategory_id: "sub1" }]);
            const qbCount = makeQueryBuilder([]);
            qbCount.select = vi.fn().mockReturnThis();
            const qbFields = makeQueryBuilder([]);

            let callCount = 0;
            mockSupabase.from.mockImplementation(() => {
                callCount++;
                if (callCount === 1) return qbCat;
                if (callCount === 2) return qbSubs;
                if (callCount === 3) return qbListings;
                if (callCount === 4) return qbCount;
                return qbFields;
            });

            const req = mockRequest("http://localhost:3000/api/categories/food");
            const res = await getCategoryBySlug(req, {
                params: Promise.resolve({ slug: "food" }),
            });
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.data.name).toBe("Food");
        });
    });

    // ─── GET /api/listings ────────────────────────────────────
    describe("GET /api/listings", () => {
        it("returns paginated results", async () => {
            const listings = [
                { id: "1", business_name: "Test Biz", listing_images: [], deals: [], subscriptions: [] },
            ];
            const qb = makeQueryBuilder(listings);
            mockSupabase.from.mockReturnValue(qb);

            const req = mockRequest("http://localhost:3000/api/listings");
            const res = await getListings(req);
            const json = await res.json();

            expect(json.success).toBe(true);
            expect(json.pagination).toBeDefined();
            expect(json.pagination.page).toBe(1);
            expect(json.filters_applied).toBeDefined();
        });

        it("applies category filter", async () => {
            const catData = { id: "cat1", parent_id: null };

            let callCount = 0;
            mockSupabase.from.mockImplementation(() => {
                callCount++;
                if (callCount <= 2) {
                    // Category resolution calls
                    const qb = makeQueryBuilder([catData]);
                    qb.maybeSingle.mockResolvedValue({ data: catData, error: null });
                    return qb;
                }
                // Top search placements
                if (callCount === 3) return makeQueryBuilder([]);
                // Main listings query
                return makeQueryBuilder([]);
            });

            const req = mockRequest("http://localhost:3000/api/listings?category=restaurants");
            const res = await getListings(req);
            const json = await res.json();

            expect(json.success).toBe(true);
            expect(json.filters_applied.category).toBe("restaurants");
        });

        it("applies sort=newest", async () => {
            mockSupabase.from.mockReturnValue(makeQueryBuilder([]));

            const req = mockRequest("http://localhost:3000/api/listings?sort=newest");
            const res = await getListings(req);
            const json = await res.json();

            expect(json.success).toBe(true);
            expect(json.filters_applied.sort).toBe("newest");
        });

        it("returns correct pagination info", async () => {
            const listings = Array.from({ length: 5 }, (_, i) => ({
                id: String(i), business_name: `Biz ${i}`,
                listing_images: [], deals: [], subscriptions: [],
            }));
            const qb = makeQueryBuilder(listings);
            mockSupabase.from.mockReturnValue(qb);

            const req = mockRequest("http://localhost:3000/api/listings?page=1&limit=5");
            const res = await getListings(req);
            const json = await res.json();

            expect(json.pagination.page).toBe(1);
            expect(json.pagination.limit).toBe(5);
            expect(json.pagination.total).toBe(5);
        });
    });

    // ─── GET /api/listings/map ────────────────────────────────
    describe("GET /api/listings/map", () => {
        it("returns lightweight map pin data", async () => {
            const listings = [
                {
                    id: "1", business_name: "Map Biz", slug: "map-biz",
                    lat: 14.83, lng: 120.28,
                    is_featured: true, is_premium: false,
                    categories: [{ name: "Food", slug: "food" }],
                    subcategories: [],
                    listing_images: [{ image_url: "/img.jpg", is_primary: true }],
                },
            ];
            mockSupabase.from.mockReturnValue(makeQueryBuilder(listings));

            const req = mockRequest("http://localhost:3000/api/listings/map");
            const res = await getMapListings(req);
            const json = await res.json();

            expect(json.success).toBe(true);
            expect(json.data).toHaveLength(1);
            expect(json.data[0].lat).toBe(14.83);
            expect(json.data[0].lng).toBe(120.28);
            expect(json.data[0].business_name).toBe("Map Biz");
        });

        it("filters out listings without coordinates", async () => {
            const listings = [
                {
                    id: "1", business_name: "No Coords", slug: "no-coords", lat: null, lng: null,
                    categories: [], subcategories: [], listing_images: [], is_featured: false, is_premium: false
                },
            ];
            mockSupabase.from.mockReturnValue(makeQueryBuilder(listings));

            const req = mockRequest("http://localhost:3000/api/listings/map");
            const res = await getMapListings(req);
            const json = await res.json();

            expect(json.data).toHaveLength(0);
        });
    });

    // ─── GET /api/top-search/[category] ───────────────────────
    describe("GET /api/top-search/[category]", () => {
        it("returns 404 for unknown category slug", async () => {
            const qb = makeQueryBuilder([]);
            qb.maybeSingle.mockResolvedValue({ data: null, error: null });
            mockSupabase.from.mockReturnValue(qb);

            const req = mockRequest("http://localhost:3000/api/top-search/unknown");
            const res = await getTopSearch(req, {
                params: Promise.resolve({ category: "unknown" }),
            });
            const json = await res.json();

            expect(res.status).toBe(404);
            expect(json.success).toBe(false);
        });

        it("returns active placements for valid category", async () => {
            const catData = { id: "cat1" };
            const placements = [
                {
                    id: "p1", position: 1,
                    listings: { id: "l1", business_name: "Top Biz", listing_images: [], deals: [], subscriptions: [], categories: [], subcategories: [], barangays: [] },
                },
            ];

            let callCount = 0;
            mockSupabase.from.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    const qb = makeQueryBuilder([catData]);
                    qb.maybeSingle.mockResolvedValue({ data: catData, error: null });
                    return qb;
                }
                return makeQueryBuilder(placements);
            });

            const req = mockRequest("http://localhost:3000/api/top-search/restaurants");
            const res = await getTopSearch(req, {
                params: Promise.resolve({ category: "restaurants" }),
            });
            const json = await res.json();

            expect(json.success).toBe(true);
            expect(json.data).toHaveLength(1);
            expect(json.data[0].position).toBe(1);
        });
    });
});
