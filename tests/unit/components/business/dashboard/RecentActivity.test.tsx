import { render, screen } from "@testing-library/react";
import RecentActivity from "@/components/business/dashboard/RecentActivity";
import { expect, test, describe, vi } from "vitest";
import { BusinessNotification } from "@/store/businessStore";

// Mock the relative time utility
vi.mock("@/lib/utils", () => ({
    getRelativeTime: vi.fn((date: string) => "2 minutes ago"),
}));

describe("RecentActivity", () => {
    const mockNotifications: BusinessNotification[] = [
        {
            id: "1",
            type: "listing_approved",
            title: "Listing Approved",
            message: "Your listing has been approved.",
            is_read: false,
            data: {},
            created_at: new Date().toISOString(),
        },
        {
            id: "2",
            type: "payment_confirmed",
            title: "Payment Received",
            message: "We received your payment.",
            is_read: true,
            data: {},
            created_at: new Date().toISOString(),
        }
    ];

    test("renders activity timeline items", () => {
        render(<RecentActivity notifications={mockNotifications} />);

        expect(screen.getByText("Listing Approved")).toBeInTheDocument();
        expect(screen.getByText("Payment Received")).toBeInTheDocument();
        expect(screen.getAllByText("2 minutes ago")).toHaveLength(2);
    });

    test("shows correct icon based on type", () => {
        render(<RecentActivity notifications={mockNotifications} />);

        expect(screen.getByText("✅")).toBeInTheDocument();
        expect(screen.getByText("💳")).toBeInTheDocument();
    });

    test("highlights unread items", () => {
        render(<RecentActivity notifications={mockNotifications} />);

        const unreadTitle = screen.getByText("Listing Approved");
        expect(unreadTitle).toHaveClass("font-semibold");
        expect(unreadTitle).toHaveClass("text-gray-900");
    });

    test("empty state shows correctly", () => {
        render(<RecentActivity notifications={[]} />);
        expect(screen.getByText("No recent activity")).toBeInTheDocument();
    });

    test("renders loading state", () => {
        const { container } = render(<RecentActivity notifications={[]} loading={true} />);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
