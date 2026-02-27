import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdSlot from "@/components/shared/AdSlot";
import { createServerSupabaseClient } from "@/lib/supabase";

// Mock Supabase Server Client
vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
}));

describe("AdSlot Server Component", () => {
    let mockSupabase: any;

    beforeEach(() => {
        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(),
        };
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    });

    it("renders an internal ad when found in database", async () => {
        mockSupabase.maybeSingle.mockResolvedValue({
            data: {
                id: "1",
                title: "Test Ad",
                image_url: "https://example.com/ad.jpg",
                target_url: "https://example.com/promo",
            },
        });

        // Await the server component function directly
        const Component = await AdSlot({ location: "homepage_banner" });
        render(Component as React.ReactElement);

        const img = screen.getByAltText("Test Ad");
        expect(img).toBeInTheDocument();

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "https://example.com/promo");
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("returns null (renders nothing) when no active ad is found", async () => {
        mockSupabase.maybeSingle.mockResolvedValue({ data: null });

        const Component = await AdSlot({ location: "homepage_banner" });
        const { container } = render(Component as React.ReactElement);

        expect(container).toBeEmptyDOMElement();
    });
});
