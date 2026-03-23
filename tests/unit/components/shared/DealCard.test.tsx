import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DealCard from "@/components/shared/DealCard";
import "@testing-library/jest-dom";

// Self-contained mocks for components that might use window/navigation
vi.mock("@/components/shared/ExpiryCountdown", () => ({
    default: ({ endDate }: any) => <div data-testid="expiry-countdown">{endDate}</div>
}));

vi.mock("@/components/shared/BadgeDisplay", () => ({
    default: ({ isPremium, isFeatured }: any) => (
        <div data-testid="badge-display">
            {isPremium && <span>Premium</span>}
            {isFeatured && <span>Featured</span>}
        </div>
    )
}));

describe("DealCard", () => {
    const mockProps = {
        id: "1",
        title: "50% Off Pizza",
        description: "Get half price on all pizzas",
        discountText: "50% OFF",
        imageUrl: "https://example.com/pizza.jpg",
        endDate: "2024-12-31T23:59:59Z",
        listingSlug: "pizza-hut",
        businessName: "Pizza Hut",
        categoryName: "Food",
        barangayName: "East Bajac-Bajac",
        isPremium: true,
        isFeatured: false,
        badges: []
    };

    it("renders deal information correctly", () => {
        render(<DealCard {...mockProps} />);

        expect(screen.getByText(mockProps.title)).toBeInTheDocument();
        expect(screen.getByText(mockProps.businessName)).toBeInTheDocument();
        expect(screen.getByText(mockProps.discountText)).toBeInTheDocument();
        expect(screen.getByText(mockProps.categoryName)).toBeInTheDocument();
        expect(screen.getByText(mockProps.barangayName)).toBeInTheDocument();
    });

    it("renders the deal image with correct src and alt", () => {
        render(<DealCard {...mockProps} />);
        const img = screen.getByAltText(mockProps.title) as HTMLImageElement;
        expect(img.src).toContain(encodeURIComponent(mockProps.imageUrl));
    });

    it("passes premium/featured flags to BadgeDisplay", () => {
        render(<DealCard {...mockProps} />);
        const badges = screen.getByTestId("badge-display");
        expect(badges).toHaveTextContent("Premium");
        expect(badges).not.toHaveTextContent("Featured");
    });

    it("links to the business page", () => {
        render(<DealCard {...mockProps} />);
        const businessLink = screen.getByRole("link", { name: mockProps.businessName });
        expect(businessLink).toHaveAttribute("href", `/olongapo/${mockProps.listingSlug}`);
    });

    it("links to the specific deal tab", () => {
        render(<DealCard {...mockProps} />);
        const viewDealLink = screen.getByRole("link", { name: /View Deal/i });
        expect(viewDealLink).toHaveAttribute("href", `/olongapo/${mockProps.listingSlug}?tab=deals&id=${mockProps.id}`);
    });

    it("truncates long descriptions", () => {
        const longDesc = "A".repeat(200);
        render(<DealCard {...mockProps} description={longDesc} />);

        const descElement = screen.getByText(/A{50,}/);
        expect(descElement.textContent?.length).toBeLessThan(longDesc.length + 5);
    });
});
