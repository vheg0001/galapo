import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionDetail } from "@/components/admin/subscriptions/SubscriptionDetail";
import { ExtendDialog } from "@/components/admin/subscriptions/ExtendDialog";
import { UpgradeDialog } from "@/components/admin/subscriptions/UpgradeDialog";
import { CancelDialog } from "@/components/admin/subscriptions/CancelDialog";
import { SubscriptionTimeline } from "@/components/admin/subscriptions/SubscriptionTimeline";

describe("SubscriptionDetail Components", () => {
    const mockSub = {
        id: "sub-123",
        plan_type: "premium",
        status: "active",
        amount: 599,
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-02-01T00:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        auto_renew: true
    };

    const mockListing = {
        id: "list-1",
        business_name: "Test Business"
    };

    const mockOwner = {
        id: "user-1",
        full_name: "Juan Dela Cruz",
        email: "juan@example.com"
    };

    it("renders subscription info completely", () => {
        render(<SubscriptionDetail subscription={mockSub} listing={mockListing} owner={mockOwner} />);
        
        expect(screen.getByText(/Status & Plan/i)).toBeInTheDocument();
        expect(screen.getByText("Premium")).toBeInTheDocument();
        expect(screen.getByText("Php 599")).toBeInTheDocument();
        expect(screen.getByText("Test Business")).toBeInTheDocument();
        expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    });

    it("Timeline shows history events in order", () => {
        const payments = [
            { id: "pay-1", amount: 599, status: "paid", created_at: "2024-01-02T00:00:00Z" }
        ];
        render(<SubscriptionTimeline subscription={mockSub} payments={payments} />);
        
        expect(screen.getByText("Subscription Created")).toBeInTheDocument();
        expect(screen.getByText("Payment Successful")).toBeInTheDocument();
        expect(screen.getByText("Scheduled Renewal")).toBeInTheDocument();
    });

    it("ExtendDialog submission works", async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any);

        render(<ExtendDialog subscriptionId="sub-123" isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
        
        fireEvent.change(screen.getByLabelText(/Days to add/i), { target: { value: "15" } });
        fireEvent.click(screen.getByRole("button", { name: /^Extend$/i }));

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining("/api/admin/subscriptions/sub-123"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining('"days":15')
                })
            );
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it("UpgradeDialog plan switching works", async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any);

        render(<UpgradeDialog subscriptionId="sub-123" currentPlan="premium" isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
        
        fireEvent.click(screen.getByText("Featured Plan"));
        fireEvent.click(screen.getByRole("button", { name: /Change Plan/i }));

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining("/api/admin/subscriptions/sub-123"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining('"new_plan":"featured"')
                })
            );
        });
    });

    it("CancelDialog requires action", async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any);

        render(<CancelDialog subscriptionId="sub-123" isOpen={true} onClose={onClose} onSuccess={onSuccess} />);
        
        fireEvent.click(screen.getByRole("button", { name: /Cancel Immediately/i }));

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining("/api/admin/subscriptions/sub-123"),
                expect.objectContaining({
                    method: "PUT",
                    body: expect.stringContaining('"action":"cancel"')
                })
            );
        });
    });
});
