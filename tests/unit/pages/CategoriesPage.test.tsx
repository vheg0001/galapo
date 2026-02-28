import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CategoriesPage from "@/app/(public)/olongapo/categories/page";

// Mock the query function
vi.mock("@/lib/queries", () => ({
    getCategoryBySlug: vi.fn(),
    getBarangaysGrouped: vi.fn(),
    getActiveCategories: vi.fn().mockResolvedValue({ data: [] }),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => {
    const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((cb) => cb({ data: [], count: 0, error: null })),
    };
    return {
        createServerSupabaseClient: vi.fn().mockResolvedValue({
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }),
    };
});

// Mock the sub-components
vi.mock("@/components/shared/Breadcrumbs", () => ({
    default: ({ items }: { items: any[] }) => (
        <nav aria-label="Breadcrumb">
            {items.map((item, i) => (
                <span key={i}>
                    {item.label}
                    {i < items.length - 1 ? " > " : ""}
                </span>
            ))}
        </nav>
    ),
}));

vi.mock("@/components/public/CategoryCard", () => ({
    default: ({ name }: { name: string }) => <div data-testid="category-card">{name}</div>,
}));

vi.mock("@/components/shared/AdSlot", () => ({
    default: () => <div data-testid="ad-slot">AdSlot</div>,
}));

// Mock the native fetch if needed, though page uses server components
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
}) as any;

describe("Categories Page (/olongapo/categories)", () => {
    it("renders breadcrumbs correctly", async () => {
        const jsx = await CategoriesPage();
        render(jsx);

        // Based on the mock which renders just the items passed:
        // {items: [{ label: "Categories", ... }]}
        expect(screen.getByText("Categories")).toBeInTheDocument();
        expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    });

    it("renders heading and description", async () => {
        const jsx = await CategoriesPage();
        render(jsx);

        expect(screen.getByRole("heading", { name: "Browse All Categories in Olongapo" })).toBeInTheDocument();
        expect(screen.getByText(/Discover local businesses across/)).toBeInTheDocument();
    });
});
