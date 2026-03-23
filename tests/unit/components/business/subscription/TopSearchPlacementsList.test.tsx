import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TopSearchPlacementsList from "@/components/business/subscription/TopSearchPlacementsList";
import type { SubscriptionListItem } from "@/lib/types";

const items: SubscriptionListItem[] = [
    {
        listing_id: "listing-1",
        listing_name: "Crest Builders Inc.",
        category_id: "cat-1",
        category_name: "Industrial & Business",
        current_plan: "free",
        subscription: null,
        top_search_placements: [
            {
                id: "placement-pending",
                category_id: "cat-1",
                category_name: "Industrial & Business",
                position: 1,
                status: "pending_payment",
                start_date: null,
                end_date: null,
                payment_id: null,
            },
            {
                id: "placement-active",
                category_id: "cat-1",
                category_name: "Industrial & Business",
                position: 2,
                status: "active",
                start_date: null,
                end_date: null,
                payment_id: "pay-2",
            },
        ],
    },
];

describe("TopSearchPlacementsList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    it("shows delete only for pending placements", () => {
        render(<TopSearchPlacementsList items={items} />);

        expect(screen.getByLabelText(/Delete pending placement for Crest Builders Inc./i)).toBeInTheDocument();
        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getAllByRole("button")).toHaveLength(1);
    });

    it("removes a pending placement after successful delete", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        render(<TopSearchPlacementsList items={items} />);

        fireEvent.click(screen.getByLabelText(/Delete pending placement for Crest Builders Inc./i));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/business/top-search/placement-pending", {
                method: "DELETE",
            });
        });

        await waitFor(() => {
            expect(screen.queryByText("Pending")).not.toBeInTheDocument();
        });
    });

    it("does not call the API when delete is not confirmed", () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        render(<TopSearchPlacementsList items={items} />);

        fireEvent.click(screen.getByLabelText(/Delete pending placement for Crest Builders Inc./i));

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
