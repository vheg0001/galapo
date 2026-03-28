import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubscriptionStatsRow } from "@/components/admin/subscriptions/SubscriptionStatsRow";

describe("SubscriptionStatsRow", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("refetches stats when the refresh key changes", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    active_featured: 3,
                    active_premium: 0,
                    expiring_this_week: 0,
                    active_mrr: 797,
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    active_featured: 2,
                    active_premium: 1,
                    expiring_this_week: 0,
                    active_mrr: 996,
                }),
            });

        vi.stubGlobal("fetch", fetchMock);

        const { rerender } = render(<SubscriptionStatsRow refreshKey={0} />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText("Active Featured").closest(".rounded-xl")).toHaveTextContent("3");
        expect(screen.getByText("Active Premium").closest(".rounded-xl")).toHaveTextContent("0");
        expect(screen.getByText("Active MRR")).toBeInTheDocument();
        expect(screen.getByText(/797/)).toBeInTheDocument();

        rerender(<SubscriptionStatsRow refreshKey={1} />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        expect(screen.getByText("Active Featured").closest(".rounded-xl")).toHaveTextContent("2");
        expect(screen.getByText("Active Premium").closest(".rounded-xl")).toHaveTextContent("1");
        expect(screen.getByText(/996/)).toBeInTheDocument();
    });
});
