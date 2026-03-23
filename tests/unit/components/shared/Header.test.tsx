import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "@/components/shared/Header";
import { useAppStore } from "@/store/appStore";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));

// Mock the Zustand store
vi.mock("@/store/appStore", () => ({
    useAppStore: vi.fn(),
}));

describe("Header Component", () => {
    let mockStore: any;

    beforeEach(() => {
        mockStore = {
            isMobileMenuOpen: false,
            toggleMobileMenu: vi.fn(),
            isSearchOpen: false,
            toggleSearch: vi.fn(),
        };
        (useAppStore as unknown as any).mockReturnValue(mockStore);
    });

    it("renders the GalaPo logo and links to home", () => {
        render(<Header categories={[]} />);
        const logoText = screen.getAllByText("GalaPo")[0];
        expect(logoText).toBeInTheDocument();
        const logoLink = logoText.closest("a");
        expect(logoLink).toHaveAttribute("href", "/");
    });

    it("renders desktop navigation links", () => {
        render(<Header categories={[]} />);
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Categories")).toBeInTheDocument();
        expect(screen.getByText("Deals")).toBeInTheDocument();
        expect(screen.getByText("Events")).toBeInTheDocument();
        expect(screen.getByText("Blog")).toBeInTheDocument();
    });

    it("shows the 'List Your Business' button", () => {
        render(<Header categories={[]} />);
        const btn = screen.getByText("List Your Business");
        expect(btn).toBeInTheDocument();
        expect(btn.closest("a")).toHaveAttribute("href", "/register");
    });

    it("toggles the mobile menu drawer", () => {
        render(<Header categories={[]} />);

        // Find the hamburger icon button (only visible on mobile, but accessible via label)
        const menuBtn = screen.getByLabelText("Toggle menu");
        fireEvent.click(menuBtn);

        expect(mockStore.toggleMobileMenu).toHaveBeenCalledTimes(1);
    });

    it("toggles the expandable search bar", () => {
        render(<Header categories={[]} />);

        const searchBtn = screen.getByLabelText("Toggle search");
        fireEvent.click(searchBtn);

        expect(mockStore.toggleSearch).toHaveBeenCalledTimes(1);
    });

    it("renders the expandable search bar when isSearchOpen is true", () => {
        mockStore.isSearchOpen = true;
        (useAppStore as unknown as any).mockReturnValue(mockStore);

        render(<Header categories={[]} />);
        const searchInput = screen.getByPlaceholderText(/Search businesses/i);
        expect(searchInput).toBeInTheDocument();
    });
});
