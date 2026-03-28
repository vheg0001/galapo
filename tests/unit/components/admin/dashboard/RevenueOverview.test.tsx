import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RevenueOverview from "@/components/admin/dashboard/RevenueOverview";

describe("RevenueOverview", () => {
    const mockBreakdown = [
        { label: "Subscriptions", amount: 15000, color: "bg-blue-500" },
        { label: "Top Search", amount: 5000, color: "bg-orange-500" },
        { label: "Reactivation Fees", amount: 2000, color: "bg-emerald-500" },
    ];

    it("renders revenue totals with currency formatting", () => {
        render(
            <RevenueOverview
                thisMonth={22000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        expect(screen.getByText("This Month")).toBeInTheDocument();
        expect(screen.getByText("Last Month")).toBeInTheDocument();
        expect(screen.getByText("All Time")).toBeInTheDocument();
        expect(screen.getByText(/22,000/)).toBeInTheDocument();
        expect(screen.getByText(/20,000/)).toBeInTheDocument();
        expect(screen.getByText(/150,000/)).toBeInTheDocument();
    });

    it("shows a percent badge when there is prior-month revenue", () => {
        render(
            <RevenueOverview
                thisMonth={22000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        expect(screen.getByText("▲ 10.0%")).toBeInTheDocument();
    });

    it("shows a new badge when last month has no revenue", () => {
        render(
            <RevenueOverview
                thisMonth={5391}
                lastMonth={0}
                allTime={5391}
                breakdown={mockBreakdown}
            />
        );

        expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("renders the revenue breakdown labels and amounts", () => {
        const { container } = render(
            <RevenueOverview
                thisMonth={22000}
                lastMonth={20000}
                allTime={150000}
                breakdown={mockBreakdown}
            />
        );

        expect(screen.getByText("Subscriptions")).toBeInTheDocument();
        expect(screen.getByText("Top Search")).toBeInTheDocument();
        expect(screen.getByText("Reactivation Fees")).toBeInTheDocument();
        expect(screen.getByText("₱15,000")).toBeInTheDocument();
        expect(screen.getByText("₱5,000")).toBeInTheDocument();
        expect(screen.getByText("₱2,000")).toBeInTheDocument();

        const bars = container.querySelectorAll(".rounded-full > div[style*='width']");
        expect(bars.length).toBe(3);
        expect(bars[0]).toHaveStyle("width: 100%");
    });
});
