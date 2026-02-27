import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "@/components/shared/SearchBar";
import { useAppStore } from "@/store/appStore";

const mockPush = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock Zustand
vi.mock("@/store/appStore", () => ({
    useAppStore: vi.fn(),
}));

describe("SearchBar Component", () => {
    let mockStore: any;

    beforeEach(() => {
        mockStore = {
            query: "",
            categoryId: null,
            setQuery: vi.fn(),
            setCategoryId: vi.fn(),
        };
        (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
        mockPush.mockClear();
    });

    const categories = [
        { id: "1", name: "Food", slug: "food" },
        { id: "2", name: "Retail", slug: "retail" },
    ];

    it("renders hero search inputs and button", () => {
        render(<SearchBar categories={categories} variant="hero" />);

        expect(screen.getByPlaceholderText(/What are you looking for/i)).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("renders compact search input", () => {
        render(<SearchBar variant="compact" />);

        expect(screen.getByPlaceholderText(/Search businesses/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
    });

    it("updates global state on input change", () => {
        render(<SearchBar categories={categories} variant="hero" />);

        const input = screen.getByPlaceholderText(/What are you looking for/i);
        fireEvent.change(input, { target: { value: "Burger" } });

        expect(mockStore.setQuery).toHaveBeenCalledWith("Burger");
    });

    it("updates global state on category select", () => {
        render(<SearchBar categories={categories} variant="hero" />);

        const select = screen.getByRole("combobox");
        fireEvent.change(select, { target: { value: "food" } });

        expect(mockStore.setCategoryId).toHaveBeenCalledWith("food");
    });

    it("navigates to /search with params on submit", () => {
        // Set state as if user typed
        mockStore.query = "Burger";
        mockStore.categoryId = "food";
        (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);

        render(<SearchBar categories={categories} variant="hero" />);

        const form = screen.getByRole("button", { name: "Search" }).closest("form");
        expect(form).not.toBeNull();
        fireEvent.submit(form!);

        expect(mockPush).toHaveBeenCalledWith("/search?q=Burger&category=food");
    });

    it("renders popular tags and navigates on click", () => {
        render(<SearchBar categories={[]} variant="hero" />);

        const tag = screen.getByText("Restaurants");
        expect(tag).toBeInTheDocument();

        fireEvent.click(tag);
        expect(mockStore.setQuery).toHaveBeenCalledWith("Restaurants");
        expect(mockPush).toHaveBeenCalledWith("/search?q=Restaurants");
    });
});
