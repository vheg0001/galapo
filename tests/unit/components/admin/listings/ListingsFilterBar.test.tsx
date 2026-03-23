import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListingsFilterBar, { ListingsFiltersValue } from "@/components/admin/listings/ListingsFilterBar";

const baseFilters: ListingsFiltersValue = {
    status: "all",
    category_id: "",
    subcategory_id: "",
    barangay_id: "",
    plan: "all",
    owner_type: "all",
    active: "all",
    date_from: "",
    date_to: "",
};

const counts = {
    all: 12,
    pending: 3,
    approved: 5,
    rejected: 2,
    draft: 1,
    claimed_pending: 1,
} as const;

const categories = [
    { id: "cat-food", name: "Food" },
    { id: "cat-hotels", name: "Hotels" },
];

const subcategories = [
    { id: "sub-cafe", name: "Cafe", parent_id: "cat-food" },
    { id: "sub-inn", name: "Inn", parent_id: "cat-hotels" },
];

const barangays = [
    { id: "brgy-1", name: "Barretto" },
    { id: "brgy-2", name: "Kalaklan" },
];

describe("ListingsFilterBar", () => {
    const onSearchChange = vi.fn();
    const onChange = vi.fn();
    const onClear = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderBar(filters: ListingsFiltersValue = baseFilters, search = "") {
        return render(
            <ListingsFilterBar
                filters={filters}
                counts={counts as any}
                categories={categories}
                subcategories={subcategories}
                barangays={barangays}
                search={search}
                onSearchChange={onSearchChange}
                onChange={onChange}
                onClear={onClear}
            />
        );
    }

    it("renders status tabs with counts", () => {
        renderBar();
        expect(screen.getByText("All")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("clicking a tab changes listing status filter", () => {
        renderBar();
        fireEvent.click(screen.getByText("Pending").closest("button") as HTMLButtonElement);
        expect(onChange).toHaveBeenCalledWith({ status: "pending" });
    });

    it("category dropdown filters listings", () => {
        renderBar();
        fireEvent.click(screen.getByRole("button", { name: /More Filters/i }));
        const categorySelect = screen.getAllByRole("combobox")[0];
        fireEvent.change(categorySelect, { target: { value: "cat-food" } });
        expect(onChange).toHaveBeenCalledWith({ category_id: "cat-food", subcategory_id: "" });
    });

    it("search input filters by business name", () => {
        renderBar();
        const input = screen.getByPlaceholderText(/Search business name, email, phone/i);
        fireEvent.change(input, { target: { value: "Cafe Uno" } });
        expect(onSearchChange).toHaveBeenCalledWith("Cafe Uno");
    });

    it("clear filters calls reset handler", () => {
        renderBar();
        fireEvent.click(screen.getByRole("button", { name: /Clear Filters/i }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("more filters expands additional controls", () => {
        renderBar();
        expect(screen.queryByText("All Categories")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /More Filters/i }));
        expect(screen.getByText("All Categories")).toBeInTheDocument();
        expect(screen.getByText("All Subcategories")).toBeInTheDocument();
    });

    it("shows active filters in current control values", () => {
        renderBar(
            {
                ...baseFilters,
                status: "approved",
                category_id: "cat-food",
                subcategory_id: "sub-cafe",
                active: "true",
                owner_type: "has_owner",
                plan: "premium",
            },
            "Cafe"
        );
        fireEvent.click(screen.getByRole("button", { name: /More Filters/i }));
        const selects = screen.getAllByRole("combobox");
        expect((selects[0] as HTMLSelectElement).value).toBe("cat-food");
        expect((selects[1] as HTMLSelectElement).value).toBe("sub-cafe");
        expect((selects[5] as HTMLSelectElement).value).toBe("true");
        expect(screen.getByPlaceholderText(/Search business name, email, phone/i)).toHaveValue("Cafe");
    });
});
