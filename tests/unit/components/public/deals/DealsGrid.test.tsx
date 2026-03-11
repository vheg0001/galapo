import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DealsGrid from "@/components/public/deals/DealsGrid";
import "@testing-library/jest-dom";

// Mock DealCard and AdSlot to keep tests focused on grid logic
vi.mock("@/components/shared/DealCard", () => ({
    default: ({ title }: any) => <div data-testid="deal-card">{title}</div>
}));

vi.mock("@/components/shared/AdSlot", () => ({
    default: ({ location }: any) => <div data-testid="ad-slot">{location}</div>
}));

describe("DealsGrid", () => {
    const mockDeals = Array.from({ length: 8 }, (_, i) => ({
        id: `deal-${i}`,
        title: `Deal ${i}`,
        description: `Description ${i}`,
        discount_text: `${i}% OFF`,
        image_url: null,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        listing: {
            business_name: `Business ${i}`,
            slug: `business-${i}`,
            is_featured: false,
            is_premium: false,
            category: { name: "Food" },
            barangay: { name: "Barangay 1" },
            listing_badges: []
        }
    }));

    it("renders the correct number of deal cards", () => {
        render(<DealsGrid deals={mockDeals.slice(0, 3)} />);
        const cards = screen.getAllByTestId("deal-card");
        expect(cards).toHaveLength(3);
        expect(cards[0]).toHaveTextContent("Deal 0");
    });

    it("renders an empty state when no deals are provided", () => {
        render(<DealsGrid deals={[]} />);

        expect(screen.getByText(/No active deals right now/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Browse Categories/i })).toBeInTheDocument();
    });

    it("renders an ad slot after every 6th card", () => {
        render(<DealsGrid deals={mockDeals} />);

        const cards = screen.getAllByTestId("deal-card");
        const ads = screen.getAllByTestId("ad-slot");

        expect(cards).toHaveLength(8);
        expect(ads).toHaveLength(1);
        expect(ads[0]).toHaveTextContent("search_inline");
    });
});
