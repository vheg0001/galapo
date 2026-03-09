import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PlanLimitIndicator from "@/components/business/deals/PlanLimitIndicator";
import "@testing-library/jest-dom";

describe("PlanLimitIndicator", () => {
    it("renders the usage counter correctly", () => {
        render(<PlanLimitIndicator used={2} total={5} />);
        expect(screen.getByText("Deal Slot Usage")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
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
        let icon = document.querySelector("svg");
        expect(icon).not.toHaveClass("text-red-500");

        rerender(<PlanLimitIndicator used={5} total={5} />);
        icon = document.querySelector("svg");
        expect(icon).toBeInTheDocument();
    });

    it("handles zero total slots gracefully", () => {
        render(<PlanLimitIndicator used={0} total={0} />);
        expect(screen.getByText(/No deal slots available/i)).toBeInTheDocument();
    });

    it("renders custom title and subtitle", () => {
        render(<PlanLimitIndicator used={1} total={3} title="Featured Deal Slot Usage" subtitle="1 listing" />);
        expect(screen.getByText("Featured Deal Slot Usage")).toBeInTheDocument();
        expect(screen.getByText("1 listing")).toBeInTheDocument();
    });
});
