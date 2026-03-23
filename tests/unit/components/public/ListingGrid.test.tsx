import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingGrid from "@/components/public/ListingGrid";

// Mock child components
vi.mock("@/components/shared/ListingCard", () => ({
    default: (props: any) => (
        <div data-testid={`listing-card-${props.id}`}>
            <span>{props.businessName}</span>
            {props.isFeatured && <span>Featured</span>}
        </div>
    ),
}));

vi.mock("@/components/shared/AdSlot", () => ({
    default: (props: any) => <div data-testid={`ad-slot-${props.position}`}>Ad</div>,
}));

vi.mock("@/components/shared/Pagination", () => ({
    default: (props: any) => (
        <nav data-testid="pagination">
            Page {props.currentPage} of {props.totalPages}
        </nav>
    ),
}));

vi.mock("@/components/public/SponsoredBadge", () => ({
    default: () => <span data-testid="sponsored-badge">Sponsored</span>,
}));

const makeListing = (overrides: Partial<any> = {}) => ({
    id: "1",
    slug: "test-biz",
    business_name: "Test Business",
    short_description: "A test business",
    is_featured: false,
    is_premium: false,
    created_at: new Date().toISOString(),
    ...overrides,
});

describe("ListingGrid Component", () => {
    it("renders listing cards in a grid", () => {
        const listings = [
            makeListing({ id: "1", business_name: "Biz One" }),
            makeListing({ id: "2", business_name: "Biz Two" }),
        ];

        render(
            <ListingGrid
                listings={listings}
                currentPage={1}
                totalPages={3}
                basePath="/olongapo/restaurants"
            />
        );

        expect(screen.getByText("Biz One")).toBeInTheDocument();
        expect(screen.getByText("Biz Two")).toBeInTheDocument();
    });

    it("shows sponsored badge for sponsored listings", () => {
        const listings = [
            makeListing({ id: "1", isSponsored: true, business_name: "Sponsored Biz" }),
        ];

        render(
            <ListingGrid listings={listings} currentPage={1} totalPages={1} basePath="/" />
        );

        expect(screen.getByTestId("sponsored-badge")).toBeInTheDocument();
    });

    it("renders pagination with correct page count", () => {
        render(
            <ListingGrid
                listings={[makeListing()]}
                currentPage={2}
                totalPages={5}
                basePath="/"
            />
        );

        expect(screen.getByTestId("pagination")).toHaveTextContent("Page 2 of 5");
    });

    it("shows empty state when no results", () => {
        render(
            <ListingGrid listings={[]} currentPage={1} totalPages={0} basePath="/" />
        );

        expect(screen.getByText("No businesses found")).toBeInTheDocument();
    });

    it("renders inline ad after every 5th listing", () => {
        const listings = Array.from({ length: 6 }, (_, i) =>
            makeListing({ id: String(i + 1), business_name: `Biz ${i + 1}` })
        );

        render(
            <ListingGrid listings={listings} currentPage={1} totalPages={1} basePath="/" />
        );

        expect(screen.getByTestId("ad-slot-1")).toBeInTheDocument();
    });
});
