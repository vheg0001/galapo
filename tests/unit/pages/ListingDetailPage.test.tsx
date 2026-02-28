import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListingDetailPage from "@/app/(public)/listing/[slug]/page";
import { getListingBySlug, getRelatedListings } from "@/lib/queries";
import { createMockListing, createMockListingImage } from "../../mocks/factories";

// Mock the queries
vi.mock("@/lib/queries", () => ({
    getListingBySlug: vi.fn(),
    getRelatedListings: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

// Mock components that cause issues in unit tests
vi.mock("@/components/public/listing/LocationMap", () => ({
    default: () => <div data-testid="location-map">Map</div>
}));

vi.mock("@/components/shared/AdSlot", () => ({
    default: () => <div data-testid="ad-slot">Ad Slot</div>
}));

// Mock leaflet CSS
vi.mock("leaflet/dist/leaflet.css", () => ({}));

describe("ListingDetailPage", () => {
    const mockListing = {
        ...createMockListing({
            business_name: "Barretto Seafood Grill",
            slug: "barretto-seafood-grill",
            owner_id: null,
            lat: 14.8386,
            lng: 120.2842,
        }),
        categories: { id: "c1", name: "Food", slug: "food", icon: "🍽️" },
        subcategories: { id: "s1", name: "Seafood", slug: "seafood" },
        barangays: { id: "b1", name: "Barretto", slug: "barretto" },
        listing_images: [createMockListingImage({ image_url: "https://example.com/img1.jpg", is_primary: true })],
        listing_field_values: [],
        deals: [],
        events: [],
        operating_hours: { monday: { open: "08:00", close: "17:00", closed: false } },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getListingBySlug as any).mockResolvedValue(mockListing);
        (getRelatedListings as any).mockResolvedValue([]);
    });

    it("renders business name as H1", async () => {
        const Page = await ListingDetailPage({ params: Promise.resolve({ slug: "barretto-seafood-grill" }) });
        await act(async () => {
            render(Page);
        });
        expect(await screen.findByRole("heading", { name: /Barretto Seafood Grill/i, level: 1 })).toBeInTheDocument();
    });

    it("renders breadcrumbs correctly", async () => {
        const Page = await ListingDetailPage({ params: Promise.resolve({ slug: "barretto-seafood-grill" }) });
        await act(async () => {
            render(Page);
        });
        const foodElements = await screen.findAllByText("Food");
        expect(foodElements.length).toBeGreaterThan(0);
    });

    it("shows 'Claim This Business' for unclaimed listings", async () => {
        const Page = await ListingDetailPage({ params: Promise.resolve({ slug: "barretto-seafood-grill" }) });
        await act(async () => {
            render(Page);
        });
        expect(await screen.findByText(/is this your business\?/i)).toBeInTheDocument();
    });

    it("renders all major sections", async () => {
        (getRelatedListings as any).mockResolvedValue([
            {
                id: "r1",
                slug: "related-1",
                business_name: "Related 1",
                short_description: "A related business description.",
                categories: { name: "Food", slug: "food" },
                barangays: { name: "Barretto", slug: "barretto" },
                listing_images: [],
                is_featured: false,
                is_premium: false
            },
        ]);

        const Page = await ListingDetailPage({ params: Promise.resolve({ slug: "barretto-seafood-grill" }) });
        await act(async () => {
            render(Page);
        });
        // Increase timeout for findings
        expect(await screen.findByTestId("location-map", {}, { timeout: 2000 })).toBeInTheDocument();
        expect(await screen.findByText(/similar businesses/i)).toBeInTheDocument();
    });
});
