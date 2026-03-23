import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RevenueOverview from "@/components/admin/dashboard/RevenueOverview";

describe("RevenueOverview", () => {
    const mockBreakdown = [
        { label: "Subscriptions", amount: 15000, color: "bg-blue-500" },
        { label: "Ads", amount: 5000, color: "bg-purple-500" },
        { label: "Fees", amount: 2000, color: "bg-emerald-500" },
    ];

    it("renders revenue totals with currency format", () => {
        render(
            <RevenueOverview
                thisMonth={22000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        // React handles non-breaking spaces in Intl.NumberFormat differently in some environments
        // We can check if the text contains the numbers and currency symbol
        expect(screen.getByText(/22,000/)).toBeInTheDocument();
        expect(screen.getByText(/20,000/)).toBeInTheDocument();
        expect(screen.getByText(/150,000/)).toBeInTheDocument();

        // Check for PHP symbol (though it might be rendered as ₱ or PHP)
        expect(screen.getAllByText(/₱|PHP/).length).toBeGreaterThan(0);
    });

    it("shows month-over-month change percentage", () => {
        const { rerender } = render(
            <RevenueOverview
                thisMonth={22000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        // (22000 - 20000) / 20000 = 10%
        expect(screen.getByText("+10.0% vs last month")).toBeInTheDocument();
        expect(screen.getByText("+10.0% vs last month")).toHaveClass("text-green-600");

        rerender(
            <RevenueOverview
                thisMonth={18000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        // (18000 - 20000) / 20000 = -10%
        expect(screen.getByText("-10.0% vs last month")).toBeInTheDocument();
        expect(screen.getByText("-10.0% vs last month")).toHaveClass("text-red-500");
    });

    it("renders breakdown categories and bars", () => {
        const { container } = render(
            <RevenueOverview
                thisMonth={22000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        expect(screen.getByText("Subscriptions")).toBeInTheDocument();
        // Use a matcher function to handle potential non-breaking spaces or currency symbol placement
        expect(screen.getByText((content) => content.includes("15,000"))).toBeInTheDocument();

        expect(screen.getByText("Ads")).toBeInTheDocument();
        expect(screen.getByText(/₱5,000/)).toBeInTheDocument();

        // Check for bar width (max breakdown is 15000)
        const bars = container.querySelectorAll(".rounded-full > div[style*='width']");
        expect(bars.length).toBe(3);

        // First bar should be 100% (15000/15000)
        expect(bars[0]).toHaveStyle("width: 100%");
        // Second bar should be ~33.3% (5000/15000)
        const width = (bars[1] as HTMLElement).style.width;
        const pct = Number.parseFloat(width.replace("%", ""));
        expect(pct).toBeGreaterThan(33.2);
        expect(pct).toBeLessThan(33.4);
    });
});
