import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDealsPage from "@/app/(admin)/admin/deals/page";

type MockLinkProps = {
    href: string;
    children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

type MockHeaderProps = {
    title: string;
    actions?: ReactNode;
};

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: MockLinkProps) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("@/components/admin/shared/AdminPageHeader", () => ({
    default: ({ title, actions }: MockHeaderProps) => (
        <div>
            <h1>{title}</h1>
            {actions}
        </div>
    ),
}));

const mockDeals = [
    {
        id: "deal-1",
        title: "Summer Sale",
        discount_text: "20% OFF",
        is_active: true,
        created_at: "2026-03-01T00:00:00.000Z",
        business_name: "Cafe Uno",
        owner_name: "Owner One",
        owner_email: "owner@example.com",
        listing_id: "listing-1",
        start_date: "2026-03-01T00:00:00.000Z",
        end_date: "2026-03-31T00:00:00.000Z",
    },
];

describe("AdminDealsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn<typeof fetch>();
    });

    it("bulk deactivates selected deals", async () => {
        const user = userEvent.setup();

        vi.mocked(global.fetch)
            .mockResolvedValueOnce(new Response(JSON.stringify({ data: mockDeals, total: mockDeals.length })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
            .mockResolvedValueOnce(new Response(JSON.stringify({
                data: [{ ...mockDeals[0], is_active: false }],
                total: mockDeals.length,
            })));

        render(<AdminDealsPage />);

        await waitFor(() => expect(screen.getByText("Summer Sale")).toBeInTheDocument());

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);
        await user.click(screen.getByText("Deactivate Selected"));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/admin/deals/bulk",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
            );
        });

        const bulkCall = vi.mocked(global.fetch).mock.calls.find(([url]) => url === "/api/admin/deals/bulk");
        expect(bulkCall).toBeTruthy();
        expect(JSON.parse(String(bulkCall?.[1]?.body))).toEqual({
            action: "deactivate",
            deal_ids: ["deal-1"],
        });
    });

    it("confirms before bulk deleting selected deals", async () => {
        const user = userEvent.setup();
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

        vi.mocked(global.fetch)
            .mockResolvedValueOnce(new Response(JSON.stringify({ data: mockDeals, total: mockDeals.length })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ data: [], total: 0 })));

        render(<AdminDealsPage />);

        await waitFor(() => expect(screen.getByText("Summer Sale")).toBeInTheDocument());

        const checkboxes = screen.getAllByRole("checkbox");
        await user.click(checkboxes[1]);
        await user.click(screen.getByText("Delete Selected"));

        expect(confirmSpy).toHaveBeenCalledWith("Are you sure you want to delete 1 selected deal?");

        const bulkCall = vi.mocked(global.fetch).mock.calls.find(([url]) => url === "/api/admin/deals/bulk");
        expect(JSON.parse(String(bulkCall?.[1]?.body))).toEqual({
            action: "delete",
            deal_ids: ["deal-1"],
        });

        confirmSpy.mockRestore();
    });
});