import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AdminStatsCard from "@/components/admin/dashboard/AdminStatsCard";

vi.mock("next/link", () => ({
    default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe("AdminStatsCard", () => {
    beforeEach(() => vi.clearAllMocks());

    const MockIcon = (props: any) => <svg data-testid="stat-icon" {...props} />;

    it("renders label, value, and icon", () => {
        render(
            <AdminStatsCard
                label="Total Users"
                value="1,234"
                icon={MockIcon as any}
            />
        );

        expect(screen.getByText("Total Users")).toBeInTheDocument();
        expect(screen.getByText("1,234")).toBeInTheDocument();
        expect(screen.getByTestId("stat-icon")).toBeInTheDocument();
    });

    it("shows positive change with green arrow", () => {
        render(
            <AdminStatsCard
                label="Stats"
                value="100"
                icon={MockIcon as any}
                trend={{ value: 15 }}
            />
        );

        const trendLine = screen.getByText(/\+15%/).closest("p");
        expect(trendLine).toBeInTheDocument();
        expect(trendLine).toHaveClass("text-green-600");
    });

    it("shows negative change with red arrow", () => {
        render(
            <AdminStatsCard
                label="Stats"
                value="100"
                icon={MockIcon as any}
                trend={{ value: -5 }}
            />
        );

        const trendLine = screen.getByText(/-5%/).closest("p");
        expect(trendLine).toBeInTheDocument();
        expect(trendLine).toHaveClass("text-red-500");
    });

    it("navigates to correct page on click", () => {
        render(
            <AdminStatsCard
                label="Listings"
                value="50"
                icon={MockIcon as any}
                href="/admin/listings"
            />
        );

        const link = screen.getByText("Listings").closest("a");
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/admin/listings");
    });

    it("shows orange highlight when urgent is true and value > 0", () => {
        render(
            <AdminStatsCard
                label="Pending"
                value="5"
                icon={MockIcon as any}
                urgent={true}
            />
        );

        const label = screen.getByText("Pending");
        const content = label.closest("div");
        const card = content?.parentElement;
        expect(card).toBeTruthy();
        expect(card).toHaveClass("border-orange-200");
    });
});
