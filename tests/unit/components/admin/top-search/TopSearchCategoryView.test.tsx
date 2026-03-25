import "@/tests/ui-mocks";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopSearchCategoryView } from "@/components/admin/top-search/TopSearchCategoryView";
import { server } from "../../../../mocks/server";
import { http, HttpResponse } from "msw";
import { APP_URL } from "@/lib/constants";
import * as React from "react";

// Robust Lucide Mock specifically for TopSearchCategoryView
vi.mock("lucide-react", () => {
    const Icon = ({ name, className }: any) => <div data-testid={`icon-${name}`} className={className} />;
    return {
        Search: (props: any) => Icon({ name: "Search", ...props }),
        Filter: (props: any) => Icon({ name: "Filter", ...props }),
        Plus: (props: any) => Icon({ name: "Plus", ...props }),
        Calendar: (props: any) => Icon({ name: "Calendar", ...props }),
        ArrowUpDown: (props: any) => Icon({ name: "ArrowUpDown", ...props }),
        MoreHorizontal: (props: any) => Icon({ name: "MoreHorizontal", ...props }),
        ChevronDown: (props: any) => Icon({ name: "ChevronDown", ...props }),
        X: (props: any) => Icon({ name: "X", ...props }),
        Check: (props: any) => Icon({ name: "Check", ...props }),
        AlertCircle: (props: any) => Icon({ name: "AlertCircle", ...props }),
        Clock: (props: any) => Icon({ name: "Clock", ...props }),
    };
});

// Mock CategorySlotCard with absolute path alias
vi.mock("@/components/admin/top-search/CategorySlotCard", () => ({
    CategorySlotCard: ({ categoryGroup }: any) => (
        <div data-testid="category-card">
            <h3>{categoryGroup.category.name}</h3>
            <p>/{categoryGroup.category.slug}</p>
            {categoryGroup.slots.map((s: any, idx: number) => {
                const daysLeft = s.placement?.end_date ? Math.ceil((new Date(s.placement.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                return (
                    <div key={idx} data-testid="slot-info">
                        {s.placement?.listings?.business_name || (s.is_available ? "Slot Available" : "Occupied")}
                        {daysLeft !== null && <span className={daysLeft < 7 ? "text-orange-600" : ""}>{daysLeft} Days Left</span>}
                    </div>
                );
            })}
        </div>
    ),
}));

const mockGroupedData = [
    {
        category: { id: "cat_1", name: "Restaurants", slug: "restaurants" },
        slots: [
            {
                slot_id: 1,
                is_available: false,
                placement: {
                    id: "pl_1",
                    end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
                    listings: { business_name: "Pizza Palace" }
                }
            },
            {
                slot_id: 2,
                is_available: true,
                placement: null
            }
        ]
    },
    {
        category: { id: "cat_2", name: "Services", slug: "services" },
        slots: [
            {
                slot_id: 1,
                is_available: true,
                placement: null
            }
        ]
    }
];

describe("TopSearchCategoryView", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading state initially", () => {
        render(<TopSearchCategoryView />);
        expect(screen.getByText(/Loading categories.../i)).toBeInTheDocument();
    });

    it("renders grouped categories correctly", async () => {
        server.use(
            http.get("/api/admin/top-search", ({ request }) => {
                const url = new URL(request.url);
                if (url.searchParams.get("format") === "grouped") {
                    return HttpResponse.json({ success: true, data: mockGroupedData });
                }
                return HttpResponse.json({ success: true, data: [] });
            })
        );

        render(<TopSearchCategoryView />);

        await waitFor(() => {
            expect(screen.getByText("Restaurants")).toBeInTheDocument();
            expect(screen.getByText("Services")).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText("Pizza Palace")).toBeInTheDocument();
        expect(screen.getAllByText("Slot Available").length).toBeGreaterThan(0);
        expect(screen.getByText("5 Days Left")).toBeInTheDocument();
    });

    it("filters categories based on search input", async () => {
        server.use(
            http.get("/api/admin/top-search", ({ request }) => {
                const url = new URL(request.url);
                if (url.searchParams.get("format") === "grouped") {
                    return HttpResponse.json({ success: true, data: mockGroupedData });
                }
                return HttpResponse.json({ success: true, data: [] });
            })
        );

        render(<TopSearchCategoryView />);

        await waitFor(() => {
            expect(screen.getByText("Restaurants")).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Filter categories/i);
        fireEvent.change(searchInput, { target: { value: "Services" } });

        await waitFor(() => {
            expect(screen.queryByText("Restaurants")).not.toBeInTheDocument();
            expect(screen.getByText("Services")).toBeInTheDocument();
        });
    });
});
