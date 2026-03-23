import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getListing } from "@/app/api/listings/[slug]/route";
import { GET as getRelated } from "@/app/api/listings/[slug]/related/route";
import { POST as trackClick } from "@/app/api/listings/[slug]/contact-click/route";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getListingBySlug, getRelatedListings } from "@/lib/queries";
import { NextRequest } from "next/server";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

// Mock Queries
vi.mock("@/lib/queries", () => ({
    getListingBySlug: vi.fn(),
    getRelatedListings: vi.fn(),
}));

// Mock Analytics to avoid DB writes in API tests
vi.mock("@/lib/analytics.server", () => ({
    trackPageViewServer: vi.fn(async () => { }),
    trackContactClickServer: vi.fn(async () => { }),
}));

describe("Listing API Integration", () => {
    const mockListing = {
        id: "123",
        business_name: "Barretto Seafood Grill",
        slug: "barretto-seafood-grill",
        status: "approved",
        is_active: true,
        is_featured: false,
        is_premium: false,
        categories: { id: "cat1", name: "Food", slug: "food" },
        subcategories: { id: "sub1", name: "Seafood", slug: "seafood" },
        barangays: { id: "brgy1", name: "Barretto", slug: "barretto" },
        listing_images: [{ image_url: "img.jpg", is_primary: true }],
        listing_field_values: [],
        deals: [],
        events: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (createServerSupabaseClient as any).mockResolvedValue({});
    });

    it("GET /api/listings/[slug] returns 200 for approved listing", async () => {
        (getListingBySlug as any).mockResolvedValue(mockListing);

        const response = await getListing(
            new NextRequest("http://localhost:3000/api/listings/barretto-seafood-grill"),
            { params: Promise.resolve({ slug: "barretto-seafood-grill" }) }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.listing.business_name).toBe("Barretto Seafood Grill");
    });

    it("GET /api/listings/[slug] returns 404 for missing listing", async () => {
        (getListingBySlug as any).mockResolvedValue(null);

        const response = await getListing(
            new NextRequest("http://localhost:3000/api/listings/non-existent"),
            { params: Promise.resolve({ slug: "non-existent" }) }
        );

        expect(response.status).toBe(404);
    });

    it("GET /api/listings/[slug]/related returns related listings", async () => {
        (getListingBySlug as any).mockResolvedValue(mockListing);
        (getRelatedListings as any).mockResolvedValue([
            { id: "r1", business_name: "Related 1", categories: {}, barangays: {}, listing_images: [] },
        ]);

        const response = await getRelated(
            new NextRequest("http://localhost:3000/api/listings/barretto-seafood-grill/related"),
            { params: Promise.resolve({ slug: "barretto-seafood-grill" }) }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.listings).toHaveLength(1);
    });

    it("POST /api/listings/[slug]/contact-click tracks event", async () => {
        const mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "123" } }),
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);

        const response = await trackClick(
            new NextRequest("http://localhost:3000/api/listings/barretto-seafood-grill/contact-click", {
                method: "POST",
                body: JSON.stringify({ type: "phone" }),
            }),
            { params: Promise.resolve({ slug: "barretto-seafood-grill" }) }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
