import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PlanLimitIndicator from "../../../components/business/deals/PlanLimitIndicator";
import "@testing-library/jest-dom";

describe("PlanLimitIndicator", () => {
    it("renders the usage counter correctly", () => {
        render(<PlanLimitIndicator used={2} total={5} />);
        expect(screen.getByText("Used 2 of 5 slots")).toBeInTheDocument();
    });

    it("renders 'Limit reached' when used >= total", () => {
        render(<PlanLimitIndicator used={5} total={5} />);
        expect(screen.getByText(/Limit reached/i)).toBeInTheDocument();
        expect(screen.getByText(/Upgrade Plan/i)).toBeInTheDocument();
    });

    it("shows remaining slots text", () => {
        render(<PlanLimitIndicator used={1} total={3} />);
        expect(screen.getByText("2 slots remaining")).toBeInTheDocument();
    });

    it("renders with warning/error colors if used is near or at limit", () => {
        const { rerender } = render(<PlanLimitIndicator used={0} total={5} />);
        let icon = screen.getByRole("status").querySelector("svg");
        expect(icon).not.toHaveClass("text-red-500");

        rerender(<PlanLimitIndicator used={5} total={5} />);
        icon = screen.getByRole("status").querySelector("svg");
        expect(icon).toHaveClass("text-red-500");
    });

    it("handles zero total slots gracefully", () => {
        render(<PlanLimitIndicator used={0} total={0} />);
        expect(screen.getByText(/Limit reached/i)).toBeInTheDocument();
    });
});
