import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CategorySidebar from "@/components/public/CategorySidebar";

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => "/olongapo/restaurants",
    useSearchParams: () => mockSearchParams,
}));

const defaultProps = {
    categoryName: "Restaurants",
    subcategories: [
        { id: "s1", name: "Fast Food", slug: "fast-food", listingCount: 15 },
        { id: "s2", name: "Fine Dining", slug: "fine-dining", listingCount: 8 },
    ],
    barangayGroups: [
        {
            header: "Olongapo City",
            items: [
                { id: "b1", name: "Kalaklan", slug: "kalaklan" },
                { id: "b2", name: "New Kalalake", slug: "new-kalalake" },
            ],
        },
    ],
};

describe("CategorySidebar Component", () => {
    beforeEach(() => {
        mockPush.mockClear();
    });

    it("renders subcategory list with counts", () => {
        render(<CategorySidebar {...defaultProps} />);

        expect(screen.getByText("Fast Food")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
        expect(screen.getByText("Fine Dining")).toBeInTheDocument();
        expect(screen.getByText("8")).toBeInTheDocument();
    });

    it('renders "All" option for subcategories', () => {
        render(<CategorySidebar {...defaultProps} />);
        expect(screen.getByText("All Restaurants")).toBeInTheDocument();
    });

    it("clicking subcategory updates URL params", () => {
        render(<CategorySidebar {...defaultProps} />);

        fireEvent.click(screen.getByText("Fast Food"));
        expect(mockPush).toHaveBeenCalledWith(
            expect.stringContaining("sub=fast-food"),
            expect.anything()
        );
    });

    it("renders barangay checkboxes grouped correctly", () => {
        render(<CategorySidebar {...defaultProps} />);

        expect(screen.getByText("Olongapo City")).toBeInTheDocument();
        expect(screen.getByText("Kalaklan")).toBeInTheDocument();
        expect(screen.getByText("New Kalalake")).toBeInTheDocument();
    });

    it("checking barangay updates URL params", () => {
        render(<CategorySidebar {...defaultProps} />);

        const checkbox = screen.getByRole("checkbox", { name: /Kalaklan/i });
        fireEvent.click(checkbox);

        expect(mockPush).toHaveBeenCalledWith(
            expect.stringContaining("barangay=kalaklan"),
            expect.anything()
        );
    });

    it('"Open Now" toggle works', () => {
        render(<CategorySidebar {...defaultProps} />);

        const openNowCheckbox = screen.getAllByRole("checkbox").find((el) => {
            const label = el.closest("label");
            return label?.textContent?.includes("Open Now");
        });
        expect(openNowCheckbox).toBeDefined();

        fireEvent.click(openNowCheckbox!);
        expect(mockPush).toHaveBeenCalledWith(
            expect.stringContaining("open_now=true"),
            expect.anything()
        );
    });

    it('"Featured Only" toggle works', () => {
        render(<CategorySidebar {...defaultProps} />);

        const featuredCheckbox = screen.getAllByRole("checkbox").find((el) => {
            const label = el.closest("label");
            return label?.textContent?.includes("Featured Only");
        });
        expect(featuredCheckbox).toBeDefined();

        fireEvent.click(featuredCheckbox!);
        expect(mockPush).toHaveBeenCalledWith(
            expect.stringContaining("featured=true"),
            expect.anything()
        );
    });

    it('"Clear all filters" resets URL', () => {
        render(<CategorySidebar {...defaultProps} />);

        fireEvent.click(screen.getByText("Clear all filters"));
        expect(mockPush).toHaveBeenCalledWith("/olongapo/restaurants", expect.anything());
    });

    it("hides subcategory filter when showSubcategoryFilter is false", () => {
        render(<CategorySidebar {...defaultProps} showSubcategoryFilter={false} />);
        expect(screen.queryByText("Subcategories")).not.toBeInTheDocument();
    });
});
