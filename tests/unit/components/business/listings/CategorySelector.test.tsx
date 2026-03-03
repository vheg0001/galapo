import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CategorySelector from "@/components/business/listings/CategorySelector";

describe("CategorySelector", () => {
    const mockOnChange = vi.fn();
    const mockCategories = [
        {
            id: "1",
            name: "Restaurants",
            icon: "utensils",
            subcategories: [{ id: "1-1", name: "Fast Food" }]
        },
        {
            id: "2",
            name: "Hotels",
            icon: "hotel",
            subcategories: []
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockCategories),
            })
        ) as any;
    });

    it("renders parent categories", async () => {
        render(<CategorySelector value="" subValue="" onChange={mockOnChange} />);
        await waitFor(() => {
            expect(screen.getByText("Restaurants")).toBeInTheDocument();
        });
    });

    it("filters categories based on search input", async () => {
        render(<CategorySelector value="" subValue="" onChange={mockOnChange} />);
        await waitFor(() => expect(screen.getByText("Restaurants")).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText(/Search for a category/i);
        fireEvent.change(searchInput, { target: { value: "Hot" } });

        await waitFor(() => {
            expect(screen.queryByText("Restaurants")).not.toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText("Hotels")).toBeInTheDocument();
    });
});
