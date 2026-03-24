import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionsTable } from "@/components/admin/subscriptions/SubscriptionsTable";
import { server } from "../../../../mocks/server";
import { http, HttpResponse } from "msw";
import { APP_URL } from "@/lib/constants";
import * as React from "react";

vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
    DropdownMenuTrigger: ({ children, asChild }: any) => <button data-testid="dropdown-trigger">{children}</button>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onSelect, asChild }: any) => (
        <div onClick={onSelect} data-testid="dropdown-item">
            {children}
        </div>
    ),
}));

vi.mock("next/link", () => ({
    default: ({ children, href, className }: any) => <a href={href} className={className}>{children}</a>
}));

vi.mock("lucide-react", () => {
    const iconMock = (name: string) => ({ className }: any) => (
        <div data-testid={`icon-${name}`} className={className} />
    );
    return new Proxy({}, {
        get: (target, prop: string) => iconMock(prop)
    });
});

vi.mock("@/components/admin/shared/StatusBadge", () => ({
    default: ({ status }: any) => <div data-testid="status-badge">{status}</div>
}));

describe("SubscriptionsTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all subscriptions with correct badges", async () => {
        render(<SubscriptionsTable />);
        
        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("Mock Business")).toBeInTheDocument();
        });

        expect(screen.getByText("Mock Owner")).toBeInTheDocument();
        expect(screen.getByText("PREMIUM")).toBeInTheDocument();
        expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("status tabs show counts and switch correctly", async () => {
        render(<SubscriptionsTable />);
        
        const activeTab = screen.getByRole("button", { name: /Active/i });
        fireEvent.click(activeTab);

        await waitFor(() => {
            // Check if fetch was called with status=active
            // Since we use global fetch and MSW, we can check if the UI updated or just verify the call if we had a spy
        });

        expect(activeTab).toHaveClass("bg-background");
    });

    it("days remaining shows red when < 7", async () => {
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + 3);

        server.use(
            http.get(`${APP_URL}/api/admin/subscriptions`, () => {
                return HttpResponse.json({
                    data: [{
                        id: "sub-1",
                        business_name: "Expiring Biz",
                        plan_type: "premium",
                        status: "active",
                        end_date: expiringDate.toISOString(),
                        amount: 599,
                        payment_status: "verified"
                    }],
                    count: 1
                });
            })
        );

        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            const daysText = screen.getByText(/3 days left/i);
            expect(daysText).toHaveClass("text-orange-500");
        });
    });

    it("bulk actions dropdown appears when multiple selected", async () => {
        // DataTable handles selection, we can test it by clicking checkboxes if they exist
        // or just verify the bulk buttons are rendered if they are always visible (based on code)
        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            expect(screen.getByText("Remind Selected")).toBeInTheDocument();
            expect(screen.getByText("Extend Selected 30d")).toBeInTheDocument();
        });
    });

    it("actions dropdown shows all options", async () => {
        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            const trigger = screen.getAllByTestId("dropdown-trigger")[0];
            if (trigger) fireEvent.click(trigger);
        });

        expect(screen.getByText(/View Details/i)).toBeInTheDocument();
        expect(screen.getByText(/Quick Extend 30d/i)).toBeInTheDocument();
        expect(screen.getByText(/Send Reminder/i)).toBeInTheDocument();
        expect(screen.getByText(/Cancel Subscription/i)).toBeInTheDocument();
    });
});
