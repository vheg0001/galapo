import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NoResults from "@/components/public/search/NoResults";

const mockCategories = [
    { id: "1", name: "Restaurants", slug: "restaurants", icon: "🍴" },
    { id: "2", name: "Hotels", slug: "hotels", icon: "🏨" }
];

describe("NoResults Component", () => {
    const mockClearFilters = vi.fn();

    it("renders generic message and suggestions when query is empty", () => {
        render(
            <NoResults
                query=""
                popularCategories={mockCategories}
                onClearFilters={mockClearFilters}
            />
        );

        expect(screen.getByText("No businesses found")).toBeInTheDocument();
        expect(screen.getByText(/We couldn't find any businesses matching your search/i)).toBeInTheDocument();
        expect(screen.getByText(/Check your spelling/i)).toBeInTheDocument();
    });

    it("renders specific message with query when query is provided", () => {
        render(
            <NoResults
                query="alien spaceship"
                popularCategories={mockCategories}
                onClearFilters={mockClearFilters}
            />
        );

        expect(screen.getByText(/No results for "alien spaceship"/i)).toBeInTheDocument();
    });

    it("renders popular categories grid", () => {
        render(
            <NoResults
                query=""
                popularCategories={mockCategories}
                onClearFilters={mockClearFilters}
            />
        );

        expect(screen.getByText("Popular Categories")).toBeInTheDocument();
        expect(screen.getByText("Restaurants")).toBeInTheDocument();
        expect(screen.getByText("Hotels")).toBeInTheDocument();
    });

    it("calls onClearFilters when Clear Filters is clicked", () => {
        render(
            <NoResults
                query=""
                popularCategories={mockCategories}
                onClearFilters={mockClearFilters}
            />
        );

        fireEvent.click(screen.getByText("Clear Filters"));
        expect(mockClearFilters).toHaveBeenCalled();
    });

    it("renders a link to browse all categories", () => {
        render(
            <NoResults
                query=""
                popularCategories={mockCategories}
                onClearFilters={mockClearFilters}
            />
        );

        const link = screen.getByRole("link", { name: /Browse All Categories/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/olongapo/categories");
    });
});
