import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/listings/route";

// Mock the queries and helpers
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/search-helpers", () => ({
    parseSearchParams: vi.fn().mockReturnValue({
        q: "pizza",
        category: null,
        subcategory: null,
        barangay: [],
        city: "olongapo",
        featuredOnly: false,
        openNow: false,
        sort: "featured",
        page: 1,
        limit: 20
    }),
    isOpenNow: vi.fn().mockReturnValue(true)
}));

vi.mock("@/lib/queries", () => ({
    searchListings: vi.fn().mockResolvedValue({
        total: 100,
        listings: [
            { id: "1", business_name: "Luigi's Pizza" },
            { id: "2", business_name: "Mario's Pizza" }
        ],
        sponsored: [
            { id: "s1", business_name: "Sponsored Pizza Hut" }
        ]
    })
}));

describe("GET /api/listings", () => {
    let mockRequest: any;

    beforeEach(() => {
        mockRequest = {
            url: "http://localhost:3000/api/listings?q=pizza"
        };
        vi.clearAllMocks();
    });

    it("returns correctly formatted paginated listings with sponsored items", async () => {
        const response = await GET(mockRequest as Request);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(2);
        expect(data.sponsored).toHaveLength(1);
        expect(data.pagination).toEqual({
            page: 1,
            limit: 20,
            total: 100,
            total_pages: 5,
            has_next: true,
            has_previous: false
        });
        expect(data.filters_applied.search).toBe("pizza");
    });
});
