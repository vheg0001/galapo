import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SearchFilterBar from "@/components/public/search/SearchFilterBar";

// Mock the components used inside FilterBar that need context or router
vi.mock("next/navigation", () => ({
    usePathname: () => "/search",
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

const mockCategories = [
    { id: "1", name: "Food", slug: "food" },
    { id: "2", name: "Hotels", slug: "hotels" }
];

const mockBarangays = [
    { id: "b1", name: "Barretto", slug: "barretto" },
    { id: "b2", name: "Kalaklan", slug: "kalaklan" }
];

describe("SearchFilterBar Component", () => {
    const mockCategoryChange = vi.fn();
    const mockBarangayToggle = vi.fn();
    const mockOpenNowToggle = vi.fn();
    const mockFeaturedOnlyToggle = vi.fn();
    const mockSortChange = vi.fn();
    const mockViewChange = vi.fn();
    const mockClearAll = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderBar = (props = {}) => {
        return render(
            <SearchFilterBar
                categories={mockCategories}
                barangays={mockBarangays}
                activeCategory=""
                activeBarangays={[]}
                openNow={false}
                featuredOnly={false}
                sort="featured"
                view="grid"
                onCategoryChange={mockCategoryChange}
                onBarangayToggle={mockBarangayToggle}
                onOpenNowToggle={mockOpenNowToggle}
                onFeaturedOnlyToggle={mockFeaturedOnlyToggle}
                onSortChange={mockSortChange}
                onViewChange={mockViewChange}
                onClearAll={mockClearAll}
                {...props}
            />
        );
    };

    it("renders category chips", () => {
        renderBar();
        expect(screen.getByText("All Categories")).toBeInTheDocument();
        expect(screen.getByText("Food")).toBeInTheDocument();
    });

    it("calls onCategoryChange when a chip is clicked", () => {
        renderBar();
        fireEvent.click(screen.getByText("Food"));
        expect(mockCategoryChange).toHaveBeenCalledWith("food");
    });

    it("calls onOpenNowToggle when the toggle is clicked", () => {
        renderBar();
        fireEvent.click(screen.getByText(/Open Now/i));
        expect(mockOpenNowToggle).toHaveBeenCalled();
    });

    it("highlights active filters correctly", () => {
        renderBar({ openNow: true, activeCategory: "food" });

        const openNowBtn = screen.getByText(/Open Now/i).closest('button');
        expect(openNowBtn).toHaveClass("border-emerald-500");

        const foodChip = screen.getByText("Food").closest('button');
        expect(foodChip).toHaveClass("bg-secondary");
    });

    it("calls onClearAll when Clear All is clicked", () => {
        renderBar();
        fireEvent.click(screen.getByText("Clear All"));
        expect(mockClearAll).toHaveBeenCalled();
    });

    it("calls onSortChange when sort dropdown changes", () => {
        renderBar();
        // Find the select that contains "Most Relevant" as an option
        const select = screen.getByDisplayValue("Most Relevant");
        fireEvent.change(select, { target: { value: "newest" } });
        expect(mockSortChange).toHaveBeenCalledWith("newest");
    });
});
