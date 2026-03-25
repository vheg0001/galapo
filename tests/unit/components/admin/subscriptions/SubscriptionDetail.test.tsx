import "@/tests/ui-mocks";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SubscriptionDetail } from "@/components/admin/subscriptions/SubscriptionDetail";
import * as React from "react";

// Mock StatusBadge specialized component
vi.mock("@/components/admin/shared/StatusBadge", () => ({
    __esModule: true,
    default: ({ status }: any) => React.createElement("div", { "data-testid": "status-badge" }, status)
}));

const mockSubscription = {
    id: "sub_123",
    status: "active",
    plan_type: "premium",
    amount: 1000,
    start_date: "2024-01-01T00:00:00Z",
    end_date: "2024-02-01T00:00:00Z",
};

const mockListing = {
    id: "list_1",
    business_name: "Test Business"
};

const mockOwner = {
    id: "user_1",
    full_name: "John Doe",
    email: "john@example.com"
};

describe("SubscriptionDetail", () => {
    it("renders subscription details correctly", () => {
        render(
            <SubscriptionDetail 
                subscription={mockSubscription} 
                listing={mockListing} 
                owner={mockOwner} 
            />
        );

        expect(screen.getByText("Test Business")).toBeInTheDocument();
        expect(screen.getByText("premium")).toBeInTheDocument();
        expect(screen.getByText("active")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders fallback for missing listing/owner", () => {
        render(
            <SubscriptionDetail 
                subscription={mockSubscription} 
                listing={null} 
                owner={null} 
            />
        );

        expect(screen.getByText("Unknown Listing")).toBeInTheDocument();
        // Since there are two "N/A" (name and email), we check for multiple
        const nas = screen.getAllByText("N/A");
        expect(nas.length).toBeGreaterThan(0);
    });
});
