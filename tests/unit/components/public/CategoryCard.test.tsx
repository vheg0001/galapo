import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CategoryCard from "@/components/public/CategoryCard";

describe("CategoryCard Component", () => {
    const defaultProps = {
        name: "Restaurants",
        slug: "restaurants",
        icon: "utensils",
        listingCount: 42,
        subcategories: [
            { name: "Fast Food" },
            { name: "Fine Dining" },
            { name: "Cafés" },
        ],
    };

    it("renders category name, listing count, and icon", () => {
        render(<CategoryCard {...defaultProps} />);

        expect(screen.getByText("Restaurants")).toBeInTheDocument();
        expect(screen.getByText("42 listings")).toBeInTheDocument();
    });

    it("renders subcategory names", () => {
        render(<CategoryCard {...defaultProps} />);

        expect(screen.getByText("Fast Food")).toBeInTheDocument();
        expect(screen.getByText("Fine Dining")).toBeInTheDocument();
        expect(screen.getByText("Cafés")).toBeInTheDocument();
    });

    it("shows '+X more' when more than 5 subcategories", () => {
        const manySubcategories = [
            { name: "Sub 1" },
            { name: "Sub 2" },
            { name: "Sub 3" },
            { name: "Sub 4" },
            { name: "Sub 5" },
            { name: "Sub 6" },
            { name: "Sub 7" },
        ];

        render(<CategoryCard {...defaultProps} subcategories={manySubcategories} />);

        expect(screen.getByText("+2 more")).toBeInTheDocument();
        // First 5 should be visible
        expect(screen.getByText("Sub 1")).toBeInTheDocument();
        expect(screen.getByText("Sub 5")).toBeInTheDocument();
        // 6th and 7th should not be visible
        expect(screen.queryByText("Sub 6")).not.toBeInTheDocument();
    });

    it("links to correct category URL", () => {
        render(<CategoryCard {...defaultProps} />);

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/olongapo/restaurants");
    });

    it("shows singular 'listing' when count is 1", () => {
        render(<CategoryCard {...defaultProps} listingCount={1} />);
        expect(screen.getByText("1 listing")).toBeInTheDocument();
    });

    it("handles empty subcategories", () => {
        render(<CategoryCard {...defaultProps} subcategories={[]} />);
        expect(screen.getByText("Restaurants")).toBeInTheDocument();
    });
});
