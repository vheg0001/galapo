import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getDeals } from "../../../app/api/deals/route";
import { NextRequest } from "next/server";

// Self-contained mock for Supabase to bypass global setup failures on Windows
vi.mock("../../../lib/supabase", () => {
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnValue(Promise.resolve({ data: [], count: 0, error: null })),
        gte: vi.fn().mockReturnThis(),
    };

    return {
        createServerSupabaseClient: vi.fn(() => Promise.resolve(mockQuery)),
    };
});

describe("Deals API Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("PUBLIC: GET /api/deals", () => {
        it("returns active deals only with default filters", async () => {
            const req = new NextRequest("http://localhost:3000/api/deals");
            const response = await getDeals(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data).toEqual([]);

            const { createServerSupabaseClient } = require("../../../lib/supabase");
            const mockQuery = await createServerSupabaseClient();

            expect(mockQuery.eq).toHaveBeenCalledWith("is_active", true);
            expect(mockQuery.gte).toHaveBeenCalledWith("end_date", expect.any(String));
        });

        it("filters by category slug when provided", async () => {
            const req = new NextRequest("http://localhost:3000/api/deals?category=food");
            await getDeals(req);

            const { createServerSupabaseClient } = require("../../../lib/supabase");
            const mockQuery = await createServerSupabaseClient();
            expect(mockQuery.eq).toHaveBeenCalledWith("listing.category.slug", "food");
        });

        it("applies featured/premium only filter", async () => {
            const req = new NextRequest("http://localhost:3000/api/deals?featured_only=true");
            await getDeals(req);

            const { createServerSupabaseClient } = require("../../../lib/supabase");
            const mockQuery = await createServerSupabaseClient();
            expect(mockQuery.or).toHaveBeenCalledWith("listing.is_featured.eq.true,listing.is_premium.eq.true");
        });

        it("handles pagination parameters", async () => {
            const req = new NextRequest("http://localhost:3000/api/deals?page=2&limit=10");
            await getDeals(req);

            const { createServerSupabaseClient } = require("../../../lib/supabase");
            const mockQuery = await createServerSupabaseClient();
            expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
        });
    });
});
