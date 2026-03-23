import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CategoryTree from "@/components/admin/categories/CategoryTree";

const mockCategories = [
    {
        id: "cat-1",
        name: "Active Category",
        slug: "active-category",
        icon: "Store",
        parent_id: null,
        sort_order: 1,
        listing_count: 5,
        is_active: true,
        subcategories: [
            {
                id: "sub-1",
                name: "Active Subcategory",
                slug: "active-subcategory",
                icon: "Tag",
                parent_id: "cat-1",
                sort_order: 1,
                listing_count: 2,
                is_active: true,
                subcategories: [],
            },
        ],
    },
    {
        id: "cat-2",
        name: "Inactive Category",
        slug: "inactive-category",
        icon: "Home",
        parent_id: null,
        sort_order: 2,
        listing_count: 0,
        is_active: false,
        subcategories: [],
    },
];

describe("CategoryTree", () => {
    const defaultProps = {
        categories: mockCategories,
        selectedId: null,
        onSelect: vi.fn(),
        onReorder: vi.fn(),
        onAddSubcategory: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders parent categories and subcategories", () => {
        render(<CategoryTree {...defaultProps} />);
        expect(screen.getByText("Active Category")).toBeInTheDocument();
        expect(screen.getByText("Inactive Category")).toBeInTheDocument();
        // Since expanded is true by default, subcategory should be visible
        expect(screen.getByText("Active Subcategory")).toBeInTheDocument();
    });

    it("toggles subcategory visibility when expand button is clicked", () => {
        render(<CategoryTree {...defaultProps} />);
        const subCat = screen.getByText("Active Subcategory");
        expect(subCat).toBeVisible();

        // The ChevronDown icon is inside a button indicating expansion
        // Find the button inside the CategoryRow for cat-1
        const expandButton = screen.getByText("Active Category").parentElement?.querySelector("button");
        expect(expandButton).not.toBeNull();

        if (expandButton) {
            fireEvent.click(expandButton);
            // It unmounts the subcategories if expanded becomes false
            expect(screen.queryByText("Active Subcategory")).not.toBeInTheDocument();
        }
    });

    it("calls onSelect when a category is clicked", () => {
        render(<CategoryTree {...defaultProps} />);
        fireEvent.click(screen.getByText("Active Category"));
        expect(defaultProps.onSelect).toHaveBeenCalledWith(mockCategories[0]);
    });

    it("filters categories based on search input", async () => {
        render(<CategoryTree {...defaultProps} />);
        const searchInput = screen.getByPlaceholderText("Search categories...");

        fireEvent.change(searchInput, { target: { value: "Inactive" } });

        expect(screen.getByText("Inactive Category")).toBeInTheDocument();
        expect(screen.queryByText("Active Category")).not.toBeInTheDocument();
        expect(screen.queryByText("Active Subcategory")).not.toBeInTheDocument();

        // Search matching subcategory should show parent and subcategory
        fireEvent.change(searchInput, { target: { value: "Subcategory" } });
        expect(screen.getByText("Active Category")).toBeInTheDocument();
        expect(screen.getByText("Active Subcategory")).toBeInTheDocument();
    });

    it("shows inactive categories with specific styling", () => {
        const { container } = render(<CategoryTree {...defaultProps} />);
        const inactiveEl = screen.getByText("Inactive Category");
        expect(inactiveEl).toHaveClass("line-through", "text-muted-foreground");
    });

    it("opens context menu on right click and triggers actions", () => {
        render(<CategoryTree {...defaultProps} />);
        const activeCat = screen.getByText("Active Category");

        fireEvent.contextMenu(activeCat, { clientX: 100, clientY: 100 });

        // Context menu should appear
        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.getByText("Add Subcategory")).toBeInTheDocument();
        expect(screen.getByText("Deactivate")).toBeInTheDocument();

        // Click Edit
        fireEvent.click(screen.getByText("Edit"));
        expect(defaultProps.onSelect).toHaveBeenCalledWith(mockCategories[0]);
        // Menu should close
        expect(screen.queryByText("Edit")).not.toBeInTheDocument();

        // Open again for Add Subcategory
        fireEvent.contextMenu(activeCat, { clientX: 100, clientY: 100 });
        fireEvent.click(screen.getByText("Add Subcategory"));
        expect(defaultProps.onAddSubcategory).toHaveBeenCalledWith("cat-1");
    });

    // Note: drag and drop testing in React Testing Library is notoriously tricky to mock perfectly without triggering exact specific events.
    // We will verify the drag start and over sets the correct classes or mock the functions if needed.
    it("handles drag and drop events", () => {
        render(<CategoryTree {...defaultProps} />);
        const cat1 = screen.getByText("Active Category").closest("div[draggable]");
        const cat2 = screen.getByText("Inactive Category").closest("div[draggable]");

        expect(cat1).not.toBeNull();
        expect(cat2).not.toBeNull();

        if (cat1 && cat2) {
            fireEvent.dragStart(cat1);
            fireEvent.dragOver(cat2);
            // Verify visual indicator logic triggers (checking classes)
            expect(cat2).toHaveClass("border-t-2", "border-primary/50");

            fireEvent.dragEnd(cat1);
        }
    });
});
