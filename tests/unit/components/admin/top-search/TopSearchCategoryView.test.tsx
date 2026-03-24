import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopSearchCategoryView } from "@/components/admin/top-search/TopSearchCategoryView";
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

vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/label", () => ({
    Label: ({ children }: any) => <label>{children}</label>,
}));

vi.mock("@/components/ui/input", () => ({
    Input: (props: any) => <input {...props} />,
}));

vi.mock("lucide-react", () => {
    const iconMock = (name: string) => ({ className }: any) => (
        <div data-testid={`icon-${name}`} className={className} />
    );
    return new Proxy({}, {
        get: (target, prop: string) => iconMock(prop)
    });
});
import { server } from "../../../../mocks/server";
import { http, HttpResponse } from "msw";
import { APP_URL } from "@/lib/constants";

describe("TopSearchCategoryView", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all categories as expandable cards", async () => {
        render(<TopSearchCategoryView />);
        
        await waitFor(() => {
            expect(screen.getByText("Restaurants")).toBeInTheDocument();
        });

        expect(screen.getByText("/restaurants")).toBeInTheDocument();
    });

    it("shows 3 position slots per category", async () => {
        render(<TopSearchCategoryView />);
        
        await waitFor(() => {
            expect(screen.getByText("Starbucks")).toBeInTheDocument(); // Slot 1 taken
            expect(screen.getAllByText("Slot Available")).toHaveLength(2); // Slot 2 and 3
        });
    });

    it("expiring soon shows orange indicator", async () => {
        const expiringDate = new Date();
        expiringDate.setDate(expiringDate.getDate() + 3);

        server.use(
            http.get(`${APP_URL}/api/admin/top-search`, () => {
                return HttpResponse.json({
                    success: true,
                    data: [{
                        category: { id: "cat-1", name: "Food", slug: "food" },
                        slots: [{
                            is_available: false,
                            position: 1,
                            placement: { id: "p-1", end_date: expiringDate.toISOString(), listing_id: "l-1" },
                            listings: { business_name: "Expiring Cafe" }
                        }, { position: 2, is_available: true, placement: null }, { position: 3, is_available: true, placement: null }]
                    }]
                });
            })
        );

        render(<TopSearchCategoryView />);
        
        await waitFor(() => {
            const daysText = screen.getByText(/3 Days Left/i);
            expect(daysText).toHaveClass("text-orange-600");
        });
    });

    it("search filters categories", async () => {
        server.use(
            http.get(`${APP_URL}/api/admin/top-search`, () => {
                return HttpResponse.json({
                    success: true,
                    data: [
                        { category: { id: "cat-1", name: "Apple", slug: "apple" }, slots: [] },
                        { category: { id: "cat-2", name: "Banana", slug: "banana" }, slots: [] }
                    ]
                });
            })
        );

        render(<TopSearchCategoryView />);
        
        await waitFor(() => expect(screen.getByText("Apple")).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText(/Filter categories/i);
        fireEvent.change(searchInput, { target: { value: "Apple" } });

        expect(screen.getByText("Apple")).toBeInTheDocument();
        expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    });
});
