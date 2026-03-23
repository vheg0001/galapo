import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ActivityFeed from "@/components/admin/dashboard/ActivityFeed";

// Mock date-fns formatDistanceToNow
vi.mock("date-fns", () => ({
    formatDistanceToNow: vi.fn(() => "2 hours ago"),
}));

describe("ActivityFeed", () => {
    const mockActivities = [
        {
            id: "1",
            type: "new_listing_submitted",
            title: "New House for Rent",
            message: "A new listing was submitted by User A",
            created_at: new Date().toISOString(),
        },
        {
            id: "2",
            type: "new_payment_uploaded",
            title: "Payment Received",
            message: "User B uploaded proof of payment",
            created_at: new Date().toISOString(),
        },
    ];

    it("renders activity items in order", () => {
        render(<ActivityFeed activities={mockActivities} />);

        expect(screen.getByText("New House for Rent")).toBeInTheDocument();
        expect(screen.getByText("A new listing was submitted by User A")).toBeInTheDocument();
        expect(screen.getByText("Payment Received")).toBeInTheDocument();
        expect(screen.getByText("User B uploaded proof of payment")).toBeInTheDocument();
    });

    it("renders relative timestamps", () => {
        render(<ActivityFeed activities={mockActivities} />);
        const timestamps = screen.getAllByText("2 hours ago");
        expect(timestamps.length).toBe(2);
    });

    it("shows 'View all' link", () => {
        render(<ActivityFeed activities={mockActivities} />);
        const viewAllLink = screen.getByText(/View all/i);
        expect(viewAllLink).toHaveAttribute("href", "/admin/notifications");
    });

    it("shows empty state when no activity", () => {
        render(<ActivityFeed activities={[]} />);
        expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
    });

    it("renders correct icons/colors based on type", () => {
        // Since we are not strictly testing the SVG path, we check the container class if possible
        const { container } = render(<ActivityFeed activities={mockActivities} />);

        // Check for blue background (new_listing_submitted)
        const listingIconContainer = container.querySelector(".bg-blue-100");
        expect(listingIconContainer).toBeInTheDocument();

        // Check for emerald background (new_payment_uploaded)
        const paymentIconContainer = container.querySelector(".bg-emerald-100");
        expect(paymentIconContainer).toBeInTheDocument();
    });
});
