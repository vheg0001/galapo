import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SearchPage from "@/components/public/search/SearchPage";

// Mock the hooks
vi.mock("@/hooks/useSearchFilters", () => ({
    useSearchFilters: () => ({
        filters: {
            q: "hotel",
            category: "",
            subcategory: "",
            barangay: [],
            city: "olongapo",
            featuredOnly: false,
            openNow: false,
            sort: "featured",
            view: "grid",
            page: 1,
            limit: 20
        },
        setQ: vi.fn(),
        setCategory: vi.fn(),
        toggleBarangay: vi.fn(),
        setSort: vi.fn(),
        setOpenNow: vi.fn(),
        setFeaturedOnly: vi.fn(),
        setPage: vi.fn(),
        setView: vi.fn(),
        clearAll: vi.fn()
    })
}));

// Mock subcomponents
vi.mock("@/components/shared/SearchBar", () => ({
    default: () => <div data-testid="mock-searchbar">SearchBar</div>
}));

vi.mock("@/components/public/search/SearchFilterBar", () => ({
    default: ({ view, onViewChange }: any) => (
        <div data-testid="mock-filterbar">
            FilterBar (View: {view})
            <button onClick={() => onViewChange("map")}>Switch to Map</button>
        </div>
    )
}));

vi.mock("@/components/public/search/SearchActiveFilters", () => ({
    default: () => <div data-testid="mock-active-filters">ActiveFilters</div>
}));

vi.mock("@/components/public/search/SearchResultsHeader", () => ({
    default: ({ total }: any) => <div data-testid="mock-results-header">Found {total} results</div>
}));

vi.mock("@/components/public/ListingGrid", () => ({
    default: () => <div data-testid="mock-grid">Grid View</div>
}));

vi.mock("@/components/public/search/SplitMapView", () => ({
    default: () => <div data-testid="mock-mapview">Map View</div>
}));

const mockListings = [
    { id: "1", business_name: "Mock Hotel", slug: "mock-hotel" }
];

const mockCategories = [{ id: "c1", name: "Hotels", slug: "hotels" }];
const mockBarangays = [{ id: "b1", name: "Barretto", slug: "barretto" }];

describe("SearchPage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        listings: mockListings,
        total: 1,
        categories: mockCategories,
        barangays: mockBarangays,
        currentPage: 1,
        totalPages: 1,
        initialQ: "hotel"
    };

    it("renders core components (SearchBar, FilterBar, ActiveFilters, ResultsHeader)", () => {
        render(<SearchPage {...defaultProps} />);

        expect(screen.getByTestId("mock-searchbar")).toBeInTheDocument();
        expect(screen.getByTestId("mock-filterbar")).toBeInTheDocument();
        expect(screen.getByTestId("mock-active-filters")).toBeInTheDocument();
        expect(screen.getByTestId("mock-results-header")).toHaveTextContent("Found 1 results");
    });

    it("renders grid view by default", () => {
        render(<SearchPage {...defaultProps} />);
        expect(screen.getByTestId("mock-grid")).toBeInTheDocument();
        expect(screen.queryByTestId("mock-mapview")).not.toBeInTheDocument();
    });

    it("displays NoResults when listings is empty", () => {
        render(<SearchPage {...defaultProps} listings={[]} total={0} />);
        expect(screen.getByText(/We couldn't find any businesses matching your search/i)).toBeInTheDocument();
        expect(screen.queryByTestId("mock-grid")).not.toBeInTheDocument();
    });
});
