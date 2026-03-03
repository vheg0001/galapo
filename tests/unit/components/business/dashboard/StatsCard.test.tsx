import { render, screen } from "@testing-library/react";
import StatsCard from "@/components/business/dashboard/StatsCard";
import { expect, test, describe } from "vitest";

describe("StatsCard", () => {
    const defaultProps = {
        icon: "📊",
        label: "Total Views",
        value: 1250,
    };

    test("renders icon, label, and value correctly", () => {
        render(<StatsCard {...defaultProps} />);

        expect(screen.getByText("📊")).toBeInTheDocument();
        expect(screen.getByText("Total Views")).toBeInTheDocument();
        expect(screen.getByText("1,250")).toBeInTheDocument();
    });

    test("shows positive change with green color and up arrow", () => {
        const { container } = render(<StatsCard {...defaultProps} change={12} />);

        const changeBadge = screen.getByText("12%");
        expect(changeBadge).toBeInTheDocument();
        expect(changeBadge).toHaveClass("text-green-600");

        // Check for TrendingUp icon (Lucide icons usually have data-lucide or class names)
        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
    });

    test("shows negative change with red color and down arrow", () => {
        render(<StatsCard {...defaultProps} change={-5} />);

        const changeBadge = screen.getByText("5%");
        expect(changeBadge).toBeInTheDocument();
        expect(changeBadge).toHaveClass("text-red-600");
    });

    test("shows neutral 0% change with gray color", () => {
        render(<StatsCard {...defaultProps} change={0} />);

        const changeBadge = screen.getByText("0%");
        expect(changeBadge).toBeInTheDocument();
        expect(changeBadge).toHaveClass("text-gray-400");
    });

    test("renders custom change label", () => {
        render(<StatsCard {...defaultProps} change={10} changeLabel="vs yesterday" />);
        expect(screen.getByText("vs yesterday")).toBeInTheDocument();
    });

    test("renders loading state", () => {
        render(<StatsCard {...defaultProps} loading={true} />);
        const skeleton = document.querySelector('.animate-pulse');
        expect(skeleton).toBeInTheDocument();
        expect(screen.queryByText("1,250")).not.toBeInTheDocument();
    });
});
