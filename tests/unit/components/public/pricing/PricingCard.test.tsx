import { render, screen } from "@testing-library/react";
import PricingCard from "@/components/public/pricing/PricingCard";
import { formatPeso } from "@/lib/subscription-helpers";
import type { PlanFeatureItem } from "@/lib/subscription-config";

const mockFeatures: PlanFeatureItem[] = [
    { label: "Basic Listing", included: true },
    { label: "Priority Support", included: false },
];

describe("PricingCard", () => {
    it("renders free card correctly", () => {
        render(
            <PricingCard
                title="Free"
                subtitle="Perfect for starters"
                price={0}
                accent="free"
                features={mockFeatures}
                ctaLabel="Get Started"
                ctaHref="/signup"
            />
        );

        expect(screen.getByText("Free")).toBeInTheDocument();
        expect(screen.getByText(formatPeso(0))).toBeInTheDocument();
        expect(screen.getByText("Perfect for starters")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/signup");
    });

    it("renders featured card with ribbon", () => {
        render(
            <PricingCard
                title="Featured"
                subtitle="Stand out from the crowd"
                price={299}
                accent="featured"
                ribbon="Most Popular"
                features={mockFeatures}
                ctaLabel="Go Featured"
                ctaHref="/upgrade?plan=featured"
            />
        );

        expect(screen.getByText("Featured")).toBeInTheDocument();
        expect(screen.getByText(formatPeso(299))).toBeInTheDocument();
        expect(screen.getByText("Most Popular")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /go featured/i })).toHaveAttribute("href", "/upgrade?plan=featured");
    });

    it("renders premium card with gold styling components (indirectly via class check)", () => {
        const { container } = render(
            <PricingCard
                title="Premium"
                subtitle="The ultimate package"
                price={599}
                accent="premium"
                features={mockFeatures}
                ctaLabel="Go Premium"
                ctaHref="/upgrade?plan=premium"
            />
        );

        expect(screen.getByText("Premium")).toBeInTheDocument();
        expect(screen.getByText(formatPeso(599))).toBeInTheDocument();
        
        // Check for specific accent styles
        const article = container.querySelector('article');
        expect(article).toHaveClass('border-amber-400');
        expect(article).toHaveClass('from-amber-50');
    });

    it("shows check/x icons based on feature inclusion", () => {
        render(
            <PricingCard
                title="Test Plan"
                subtitle="Sub"
                price={100}
                features={mockFeatures}
                ctaLabel="Buy"
            />
        );

        // Check icon (Check lucide icon results in specific classes or structure)
        const checkIcon = screen.getByText("Basic Listing").previousElementSibling;
        expect(checkIcon).toHaveClass("bg-emerald-100");
        
        const xIcon = screen.getByText("Priority Support").previousElementSibling;
        expect(xIcon).toHaveClass("bg-rose-100");
    });

    it("renders 'Current Plan' state", () => {
        render(
            <PricingCard
                title="Featured"
                subtitle="Sub"
                price={299}
                accent="featured"
                features={mockFeatures}
                ctaLabel="Go Featured"
                currentPlan={true}
            />
        );

        expect(screen.getAllByText("Current Plan")).toHaveLength(2);
        const button = screen.getByRole("button", { name: /current plan/i });
        expect(button).toBeDisabled();
    });
});
