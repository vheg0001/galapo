import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PendingItems from "@/components/admin/dashboard/PendingItems";

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}));

// Mock StatusBadge component
vi.mock("@/components/admin/shared/StatusBadge", () => ({
    default: ({ status }: { status: string }) => <div data-testid="status-badge">{status}</div>,
}));

// Mock date-fns format
vi.mock("date-fns", () => ({
    format: vi.fn(() => "Jan 1, 2024 12:00"),
}));

describe("PendingItems", () => {
    const mockListings = [
        { id: "l1", name: "Listing A", owner: "Owner A", date: "2024-01-01", status: "pending", reviewHref: "/review/l1" }
    ];
    const mockPayments = [
        { id: "p1", name: "Payment A", owner: "Owner B", date: "2024-01-01", status: "pending", reviewHref: "/review/p1" }
    ];
    const mockClaims = [
        { id: "c1", name: "Claim A", owner: "Owner C", date: "2024-01-01", status: "pending", reviewHref: "/review/c1" }
    ];

    it("tab switching works and shows correct items", () => {
        render(<PendingItems listings={mockListings} payments={mockPayments} claims={mockClaims} />);

        // Default tab is listings
        expect(screen.getByText("Listing A")).toBeInTheDocument();
        expect(screen.queryByText("Payment A")).not.toBeInTheDocument();

        // Switch to Payments
        fireEvent.click(screen.getByText(/Payments/i));
        expect(screen.getByText("Payment A")).toBeInTheDocument();
        expect(screen.queryByText("Listing A")).not.toBeInTheDocument();

        // Switch to Claims
        fireEvent.click(screen.getByText(/Claims/i));
        expect(screen.getByText("Claim A")).toBeInTheDocument();
        expect(screen.queryByText("Payment A")).not.toBeInTheDocument();
    });

    it("shows counts in tab buttons", () => {
        render(<PendingItems listings={mockListings} payments={[]} claims={mockClaims} />);

        const listingsTab = screen.getByRole("button", { name: /Listings/i });
        expect(listingsTab).toHaveTextContent("1");

        const claimsTab = screen.getByRole("button", { name: /Claims/i });
        expect(claimsTab).toHaveTextContent("1");

        const paymentsTab = screen.getByRole("button", { name: /Payments/i });
        expect(paymentsTab).not.toHaveTextContent("0");
    });

    it("Review buttons navigate correctly", () => {
        render(<PendingItems listings={mockListings} payments={[]} claims={[]} />);

        const reviewBtn = screen.getByText("Review");
        expect(reviewBtn.closest("a")).toHaveAttribute("href", "/review/l1");
    });

    it("View All links navigate correctly", () => {
        render(<PendingItems listings={mockListings} payments={[]} claims={[]} />);

        const viewAllLink = screen.getByText(/View all 1 pending listings/i);
        expect(viewAllLink).toHaveAttribute("href", "/admin/listings?status=pending");
    });

    it("shows empty state when nothing pending in a tab", () => {
        render(<PendingItems listings={[]} payments={[]} claims={[]} />);

        expect(screen.getByText(/No pending listings/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Payments/i));
        expect(screen.getByText(/No pending payments/i)).toBeInTheDocument();
    });
});
