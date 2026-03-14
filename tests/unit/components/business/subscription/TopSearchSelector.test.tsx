import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TopSearchSelector from "@/components/business/subscription/TopSearchSelector";
import type { Category } from "@/lib/types";

const mockCategories: Category[] = [
    { id: "cat-1", name: "Main Category", slug: "main", icon: "icon", parent_id: null, sort_order: 1, is_active: true, created_at: "" },
    { id: "cat-2", name: "Subcategory", slug: "sub", icon: "icon", parent_id: "cat-1", sort_order: 2, is_active: true, created_at: "" },
];

const mockAvailability = {
    category_name: "Main Category",
    slots: [
        { position: 1, status: "taken", listing_name: "Business A" },
        { position: 2, status: "available" },
        { position: 3, status: "available" },
    ],
    available_count: 2,
};

describe("TopSearchSelector", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation((url: string) => {
            if (url.includes("/api/categories")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: mockCategories }),
                });
            }
            if (url.includes("/api/business/top-search/availability")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockAvailability),
                });
            }
            return Promise.reject(new Error("Unknown API"));
        });
    });

    it("renders categories and checks availability for the selected one", async () => {
        const onSelectCategory = vi.fn();
        const onSelectPosition = vi.fn();

        render(
            <TopSearchSelector
                listingId="listing-123"
                categoryId="cat-1"
                subcategoryId="cat-2"
                selectedCategory={null}
                selectedPosition={null}
                onSelectCategory={onSelectCategory}
                onSelectPosition={onSelectPosition}
            />
        );

        // Wait for categories to load
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /main category/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /subcategory/i })).toBeInTheDocument();
        });

        // The component auto-selects the primary category
        await waitFor(() => {
            expect(onSelectCategory).toHaveBeenCalledWith(mockCategories[0]);
        });
    });

    it("renders slots with availability status", async () => {
        render(
            <TopSearchSelector
                listingId="listing-123"
                categoryId="cat-1"
                selectedCategory={mockCategories[0]}
                selectedPosition={2}
                onSelectCategory={vi.fn()}
                onSelectPosition={vi.fn()}
            />
        );

        // Wait for availability to load
        await waitFor(() => {
            expect(screen.getByText("#1")).toBeInTheDocument();
            expect(screen.getByText("#2")).toBeInTheDocument();
            expect(screen.getByText("#3")).toBeInTheDocument();
        });

        expect(screen.getByText(/Taken by Business A/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Available for Purchase/i)).toHaveLength(2);
        
        // Slot 1 should be disabled
        const slot1 = screen.getByText("#1").closest("button");
        expect(slot1).toBeDisabled();

        // Slot 2 should be selected
        const slot2 = screen.getByText("#2").closest("button");
        expect(slot2).toHaveClass("border-[#FF6B35]");
    });

    it("calls onSelectPosition when an available slot is clicked", async () => {
        const onSelectPosition = vi.fn();
        render(
            <TopSearchSelector
                listingId="listing-123"
                categoryId="cat-1"
                selectedCategory={mockCategories[0]}
                selectedPosition={null}
                onSelectCategory={vi.fn()}
                onSelectPosition={onSelectPosition}
            />
        );

        await waitFor(() => screen.getByText("#3"));
        
        const slot3 = screen.getByText("#3").closest("button")!;
        fireEvent.click(slot3);
        
        expect(onSelectPosition).toHaveBeenCalledWith(3);
    });

    it("shows 'please select category' message when no category is selected", () => {
        render(
            <TopSearchSelector
                listingId="listing-123"
                categoryId="cat-1"
                selectedCategory={null}
                selectedPosition={null}
                onSelectCategory={vi.fn()}
                onSelectPosition={vi.fn()}
            />
        );

        expect(screen.getByText(/Please select a category first/i)).toBeInTheDocument();
    });
});
