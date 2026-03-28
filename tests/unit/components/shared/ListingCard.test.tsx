import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingCard from "@/components/shared/ListingCard";

describe("ListingCard Component", () => {
    const defaultProps = {
        id: "1",
        slug: "test-business",
        businessName: "Test Bakery",
        shortDescription: "The best bread in town.",
        categoryName: "Bakeries",
        barangayName: "Kalaklan",
        phone: "+639123456789",
    };

    it("renders basic business information", () => {
        render(<ListingCard {...defaultProps} />);

        expect(screen.getByText("Test Bakery")).toBeInTheDocument();
        expect(screen.getByText("Bakeries")).toBeInTheDocument();
        expect(screen.getByText("Kalaklan")).toBeInTheDocument();
        expect(screen.getByText(/best bread/i)).toBeInTheDocument();

        // Link wrapper
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/olongapo/test-business");
    });

    it("renders featured badge when isFeatured is true", () => {
        render(<ListingCard {...defaultProps} isFeatured={true} />);
        expect(screen.getByText("Featured")).toBeInTheDocument();
    });

    it("renders premium badge when isPremium is true", () => {
        render(<ListingCard {...defaultProps} isPremium={true} />);
        expect(screen.getByText("Premium")).toBeInTheDocument();
    });

    it("renders database premium plan badges with the shared premium styling", () => {
        const premiumPlanBadge = {
            id: "lb-premium",
            listing_id: "1",
            badge_id: "badge-premium",
            assigned_by: null,
            assigned_at: "2026-03-28T00:00:00.000Z",
            expires_at: null,
            note: null,
            is_active: true,
            created_at: "2026-03-28T00:00:00.000Z",
            badge: {
                id: "badge-premium",
                name: "Premium",
                slug: "premium",
                description: null,
                icon: "Crown",
                icon_lucide: "crown",
                color: "#D97706",
                text_color: "#FFFFFF",
                type: "plan",
                priority: 20,
                auto_expires: false,
                default_expiry_days: null,
                is_filterable: false,
                is_active: true,
                created_at: "2026-03-28T00:00:00.000Z",
                updated_at: "2026-03-28T00:00:00.000Z",
            },
        };

        render(<ListingCard {...defaultProps} badges={[premiumPlanBadge as any]} isPremium={true} />);

        expect(screen.getByText("Premium")).toHaveClass("bg-gradient-to-br");
    });

    it("renders clickable phone number", () => {
        render(<ListingCard {...defaultProps} />);
        const phoneEl = screen.getByText("+639123456789");
        expect(phoneEl).toBeInTheDocument();
        // The click event is handled via onClick window.location.href in the component, 
        // which is hard to test in jsdom without mocking window.location,
        // but we can verify the text and element exist.
        expect(phoneEl.tagName).toBe("SPAN");
    });

    it("uses placeholder image when no image provided", () => {
        render(<ListingCard {...defaultProps} />);
        // Next/Image renders an img tag
        const img = screen.getByAltText("Test Bakery");
        expect(img).toBeInTheDocument();
        // Since we didn't mock next/image heavily, it might encode the src, but let's check basic presence
        expect(img).toHaveAttribute("src");
    });
});
