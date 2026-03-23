import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PricingTable from "@/components/public/pricing/PricingTable";
import type { PricingResponse } from "@/lib/types";

vi.mock("@/store/authStore", () => ({
    useAuthStore: (selector: (state: { isAuthenticated: boolean }) => boolean) =>
        selector({ isAuthenticated: false }),
}));

const mockPricing: PricingResponse = {
    featured_monthly: 299,
    premium_monthly: 599,
    top_search_monthly: 999,
    ad_placement_monthly: 1499,
    advertising_packages: [
        {
            id: "featured-tier",
            name: "Featured Listing",
            price: "499",
            interval: "/mo",
            description: "Best for growing businesses",
            features: ["Priority placement", "Homepage visibility"],
            is_popular: true,
            button_text: "Get Featured",
            button_link: "/register?plan=featured",
        },
        {
            id: "premium-tier",
            name: "Premium Listing",
            price: "899",
            interval: "/mo",
            description: "Everything you need for maximum reach",
            features: ["Top priority", "Advanced analytics"],
            is_popular: false,
            button_text: "Go Premium",
            button_link: "/register?plan=premium",
        },
    ],
};

describe("PricingTable", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockPricing,
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses advertising package data for pricing cards when package names include listing suffixes", () => {
        render(<PricingTable initialPricing={mockPricing} />);

        expect(screen.getByText("Featured Listing")).toBeInTheDocument();
        expect(screen.getByText("Premium Listing")).toBeInTheDocument();
        expect(screen.getByText("Best for growing businesses")).toBeInTheDocument();
        expect(screen.getByText("Everything you need for maximum reach")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Get Featured" })).toHaveAttribute("href", "/register?plan=featured");
        expect(screen.getByRole("link", { name: "Go Premium" })).toHaveAttribute("href", "/register?plan=premium");
        expect(screen.getByText("Priority placement")).toBeInTheDocument();
        expect(screen.getByText("Advanced analytics")).toBeInTheDocument();
    });
});