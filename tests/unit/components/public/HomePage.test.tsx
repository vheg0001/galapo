import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(public)/page";
import { createServerSupabaseClient } from "@/lib/supabase";

// Mock Supabase Server Client
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

// Mock Next Navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Zustand
vi.mock("@/store/appStore", () => ({
    useAppStore: () => ({
        query: "",
        categoryId: null,
        setQuery: vi.fn(),
        setCategoryId: vi.fn(),
    }),
}));

// Mock MapView to avoid Leaflet in JSDOM
vi.mock("@/components/shared/MapView", () => ({
    default: () => <div data-testid="mock-map">Map View Mock</div>,
}));

// Mock AdSlot
vi.mock("@/components/shared/AdSlot", () => ({
    default: () => <div data-testid="mock-adslot">Ad Slot Mock</div>,
}));

describe("HomePage Component", () => {
    let mockSupabase: any;

    beforeEach(() => {
        const mockReturn = { data: [], error: null };
        const mockQueryBuilder: any = {
            select: vi.fn(() => mockQueryBuilder),
            eq: vi.fn(() => mockQueryBuilder),
            order: vi.fn(() => mockQueryBuilder),
            limit: vi.fn(() => mockQueryBuilder),
            gte: vi.fn(() => mockQueryBuilder),
            is: vi.fn(() => mockQueryBuilder),
            not: vi.fn(() => mockQueryBuilder),
            or: vi.fn(() => mockQueryBuilder),
            then: vi.fn((cb) => cb(mockReturn)),
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    });

    it("renders the hero section with search bar", async () => {
        const Cmp = await HomePage();
        render(Cmp as React.ReactElement);

        expect(screen.getByText(/Discover the Best of/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/What are you looking for/i)).toBeInTheDocument();
    });

    it("renders the categories section", async () => {
        const Cmp = await HomePage();
        render(Cmp as React.ReactElement);

        expect(screen.getByText(/Browse by Category/i)).toBeInTheDocument();
    });

    it("renders the CTA Banner", async () => {
        const Cmp = await HomePage();
        render(Cmp as React.ReactElement);

        expect(screen.getByText(/Own a Business in Olongapo/i)).toBeInTheDocument();
        const btn = screen.getByText(/Get Started/i);
        expect(btn).toBeInTheDocument();
        expect(btn.closest("a")).toHaveAttribute("href", "/register");
    });

    it("renders the mocked Map section", async () => {
        const Cmp = await HomePage();
        render(Cmp as React.ReactElement);

        expect(screen.getByText(/Explore Olongapo/i)).toBeInTheDocument();
        expect(screen.getByTestId("mock-map")).toBeInTheDocument();
    });

    it("renders ad slots", async () => {
        const Cmp = await HomePage();
        render(Cmp as React.ReactElement);

        const adSlots = screen.getAllByTestId("mock-adslot");
        expect(adSlots.length).toBeGreaterThan(0);
    });
});
