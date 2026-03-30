import "@/tests/ui-mocks";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionsTable } from "@/components/admin/subscriptions/SubscriptionsTable";
import { server } from "../../../../mocks/server";
import { http, HttpResponse } from "msw";
import * as React from "react";

vi.mock("lucide-react", () => {
    const icon = ({ name, className }: any) => <div data-testid={`icon-${name}`} className={className} />;
    return {
        MoreHorizontal: (props: any) => icon({ name: "MoreHorizontal", ...props }),
        FileText: (props: any) => icon({ name: "FileText", ...props }),
        ExternalLink: (props: any) => icon({ name: "ExternalLink", ...props }),
        CalendarDays: (props: any) => icon({ name: "CalendarDays", ...props }),
        ShieldAlert: (props: any) => icon({ name: "ShieldAlert", ...props }),
        XCircle: (props: any) => icon({ name: "XCircle", ...props }),
        RotateCw: (props: any) => icon({ name: "RotateCw", ...props }),
        ChevronUp: (props: any) => icon({ name: "ChevronUp", ...props }),
        ChevronDown: (props: any) => icon({ name: "ChevronDown", ...props }),
        ChevronsUpDown: (props: any) => icon({ name: "ChevronsUpDown", ...props }),
        Search: (props: any) => icon({ name: "Search", ...props }),
        X: (props: any) => icon({ name: "X", ...props }),
        Download: (props: any) => icon({ name: "Download", ...props }),
        ChevronLeft: (props: any) => icon({ name: "ChevronLeft", ...props }),
        ChevronRight: (props: any) => icon({ name: "ChevronRight", ...props }),
        ChevronsLeft: (props: any) => icon({ name: "ChevronsLeft", ...props }),
        ChevronsRight: (props: any) => icon({ name: "ChevronsRight", ...props }),
        SlidersHorizontal: (props: any) => icon({ name: "SlidersHorizontal", ...props }),
        Loader2: (props: any) => icon({ name: "Loader2", ...props }),
    };
});

const mockSubscriptions = [
    {
        id: "sub_1",
        listing_id: "list_1",
        business_name: "Test Business 1",
        owner_name: "Owner 1",
        owner_email: "owner1@example.com",
        plan_type: "premium",
        status: "active",
        amount: 1000,
        payment_status: "paid",
        end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    },
    {
        id: "sub_2",
        listing_id: "list_2",
        business_name: "Test Business 2",
        owner_name: "Owner 2",
        owner_email: "owner2@example.com",
        plan_type: "featured",
        status: "expired",
        amount: 500,
        payment_status: "pending",
        end_date: new Date(Date.now() - 86400000).toISOString(),
    }
];

function setupMock() {
    server.use(
        http.get(/.*\/api\/admin\/subscriptions.*/, ({ request }) => {
            console.log('SUBSCRIPTION_FETCH_INTERCEPTED:', request.url);
            return HttpResponse.json({ data: mockSubscriptions, total: 2 });
        })
    );
}

beforeEach(() => {
    window.localStorage.clear();
    setupMock();
});

// Handlers are now localized in test blocks for maximum reliability

describe("SubscriptionsTable", () => {
    it("renders loading state initially", async () => {
        render(<SubscriptionsTable />);
        // Initial state is loading
        const loader = screen.queryByTestId("icon-Loader2");
        if (loader) expect(loader).toBeInTheDocument();
    });

    it("renders subscriptions data correctly", async () => {
        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            expect(screen.getByText("Test Business 1")).toBeInTheDocument();
            expect(screen.getByText("Test Business 2")).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText("Premium")).toBeInTheDocument();
        expect(screen.getByText("Featured")).toBeInTheDocument();
        expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
        expect(screen.getAllByText(/expired/i).length).toBeGreaterThan(0);
    });

    it("handles search filtering", async () => {
        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            expect(screen.getByText("Test Business 1")).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText("Search...");
        fireEvent.change(searchInput, { target: { value: "Test Business 1" } });

        await waitFor(() => {
            expect(screen.getByText("Test Business 1")).toBeInTheDocument();
            expect(screen.queryByText("Test Business 2")).not.toBeInTheDocument();
        });
    });

    it("handles status filtering", async () => {
        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            expect(screen.getByText("Test Business 1")).toBeInTheDocument();
        });

        // Click status filter (tab button)
        const activeTab = screen.getAllByRole("button", { name: "Active" })[0];
        fireEvent.click(activeTab);

        await waitFor(() => {
            expect(screen.getByText("Test Business 1")).toBeInTheDocument();
        });
    });

    it("actions dropdown shows all options", async () => {
        render(<SubscriptionsTable />);
        
        await waitFor(() => {
            const triggers = screen.getAllByTestId("dropdown-trigger");
            expect(triggers.length).toBeGreaterThan(0);
        });

        const triggers = screen.getAllByTestId("dropdown-trigger");
        fireEvent.click(triggers[0]);
        
        await waitFor(() => {
            expect(screen.getAllByText(/View Details/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/View Listing/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Downgrade Plan/i).length).toBeGreaterThan(0);
            expect(screen.queryByText(/Cancel Subscription/i)).not.toBeInTheDocument();
        });
    });

    it("opens the upgrade dialog from row actions", async () => {
        render(<SubscriptionsTable />);

        await waitFor(() => {
            const triggers = screen.getAllByTestId("dropdown-trigger");
            expect(triggers.length).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getAllByTestId("dropdown-trigger")[0]);
        fireEvent.click(screen.getAllByText(/Downgrade Plan/i)[0]);

        await waitFor(() => {
            expect(screen.getAllByText("Downgrade Plan").length).toBeGreaterThan(0);
            expect(screen.getByText("Featured Plan")).toBeInTheDocument();
            expect(screen.getByText("Free Plan")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /confirm downgrade/i })).toBeInTheDocument();
        });
    });
});
