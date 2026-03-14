import { render, screen, fireEvent } from "@testing-library/react";
import CurrentPlanCard from "@/components/business/subscription/CurrentPlanCard";
import type { SubscriptionListItem } from "@/lib/types";

const mockFreeItem: SubscriptionListItem = {
    listing_id: "listing-123",
    listing_name: "My Awesome Cafe",
    category_name: "Food & Drink",
    current_plan: "free",
    subscription: null,
    top_search_placements: [],
};

const mockActiveItem: SubscriptionListItem = {
    listing_id: "listing-456",
    listing_name: "Premium Spa",
    category_name: "Health & Beauty",
    current_plan: "premium",
    subscription: {
        id: "sub-789",
        plan_type: "premium",
        status: "active",
        start_date: "2026-01-01T00:00:00Z",
        end_date: "2026-02-01T00:00:00Z",
        days_remaining: 15,
        is_expiring_soon: false,
        auto_renew: true,
    },
    top_search_placements: [],
};

const mockExpiringSoonItem: SubscriptionListItem = {
    listing_id: "listing-789",
    listing_name: "Featured Hotel",
    category_name: "Travel",
    current_plan: "featured",
    subscription: {
        id: "sub-012",
        plan_type: "featured",
        status: "expiring_soon",
        start_date: "2026-01-01T00:00:00Z",
        end_date: "2026-01-14T00:00:00Z",
        days_remaining: 3,
        is_expiring_soon: true,
        auto_renew: false,
    },
    top_search_placements: [],
};

const mockExpiredItem: SubscriptionListItem = {
    listing_id: "listing- expired",
    listing_name: "Old Gym",
    category_name: "Sports",
    current_plan: "featured",
    subscription: {
        id: "sub-expired",
        plan_type: "featured",
        status: "expired",
        start_date: "2025-12-01T00:00:00Z",
        end_date: "2026-01-01T00:00:00Z",
        days_remaining: 0,
        is_expiring_soon: false,
        auto_renew: false,
    },
    top_search_placements: [],
};

describe("CurrentPlanCard", () => {
    it("renders free plan correctly", () => {
        render(<CurrentPlanCard item={mockFreeItem} />);

        expect(screen.getByText("My Awesome Cafe")).toBeInTheDocument();
        expect(screen.getByText("free")).toBeInTheDocument();
        expect(screen.getByText("Free Listing")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /upgrade listing/i })).toBeInTheDocument();
    });

    it("renders active premium plan correctly", () => {
        render(<CurrentPlanCard item={mockActiveItem} />);

        expect(screen.getByText("Premium Spa")).toBeInTheDocument();
        expect(screen.getByText("premium")).toBeInTheDocument();
        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getByText(/15 days left/i)).toBeInTheDocument();
        expect(screen.getByText("Enabled")).toBeInTheDocument(); // Auto-renew
        expect(screen.getByRole("link", { name: /change plan/i })).toBeInTheDocument();
    });

    it("renders expiring soon warning and renew button", () => {
        const onRenew = vi.fn();
        render(<CurrentPlanCard item={mockExpiringSoonItem} onRenew={onRenew} />);

        expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
        const renewBtn = screen.getByRole("button", { name: /renew now/i });
        expect(renewBtn).toBeInTheDocument();
        
        fireEvent.click(renewBtn);
        expect(onRenew).toHaveBeenCalledWith("listing-789", "sub-012");
    });

    it("renders expired status correctly", () => {
        render(<CurrentPlanCard item={mockExpiredItem} />);

        expect(screen.getByText("Expired")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /renew now/i })).toBeInTheDocument();
    });

    it("renders pending verification status", () => {
        const pendingItem = {
            ...mockActiveItem,
            subscription: { ...mockActiveItem.subscription!, status: "pending_payment" as any }
        };
        render(<CurrentPlanCard item={pendingItem} />);

        expect(screen.getByText("Pending Verification")).toBeInTheDocument();
    });
});
