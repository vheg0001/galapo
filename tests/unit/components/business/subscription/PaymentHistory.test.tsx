import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PaymentHistory from "@/components/business/subscription/PaymentHistory";

const mockPayments = [
    {
        id: "pay-1",
        created_at: "2026-03-01T10:00:00Z",
        description: "Premium Plan Upgrade",
        listing_name: "Awesome Cafe",
        amount: 599,
        status: "verified",
        invoice: { id: "inv-1" }
    },
    {
        id: "pay-2",
        created_at: "2026-03-02T10:00:00Z",
        description: "Featured Plan Upgrade",
        listing_name: "Cool Boutique",
        amount: 299,
        status: "pending",
        invoice: null
    },
    {
        id: "pay-3",
        created_at: "2026-03-03T10:00:00Z",
        description: "Top Search Placement",
        listing_name: "Best Hotel",
        amount: 999,
        status: "rejected",
        invoice: null
    }
];

describe("PaymentHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    data: mockPayments,
                    total: 3,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }),
            })
        );
    });

    it("renders loading state initially", () => {
        render(<PaymentHistory userId="user-123" />);
        expect(screen.getByText(/Loading history…/i)).toBeInTheDocument();
    });

    it("renders payment table with data", async () => {
        render(<PaymentHistory userId="user-123" />);

        await waitFor(() => {
            expect(screen.getByText("Premium Plan Upgrade")).toBeInTheDocument();
            expect(screen.getByText("VERIFIED")).toBeInTheDocument();
            expect(screen.getByText("PENDING")).toBeInTheDocument();
            expect(screen.getByText("REJECTED")).toBeInTheDocument();
        });

        expect(screen.getByText("Awesome Cafe")).toBeInTheDocument();
        expect(screen.getByText("₱599")).toBeInTheDocument();
    });

    it("shows invoice download button only for payments with invoice", async () => {
        render(<PaymentHistory userId="user-123" />);

        await waitFor(() => {
            const downloadButtons = screen.queryAllByTitle("Download Invoice");
            expect(downloadButtons).toHaveLength(1);
        });
    });

    it("handles pagination clicks", async () => {
        global.fetch = vi.fn()
            .mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: mockPayments.slice(0, 1),
                        total: 15,
                        page: 1,
                        limit: 1,
                        totalPages: 2
                    }),
                })
            )
            .mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: mockPayments.slice(1, 2),
                        total: 15,
                        page: 2,
                        limit: 1,
                        totalPages: 2
                    }),
                })
            );

        render(<PaymentHistory userId="user-123" />);

        await waitFor(() => screen.getByText("Next"));
        
        const nextBtn = screen.getByText("Next");
        fireEvent.click(nextBtn);

        await waitFor(() => {
            expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("page=2"));
        });
    });

    it("renders empty state", async () => {
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: [], total: 0, totalPages: 0 }),
            })
        );

        render(<PaymentHistory userId="user-123" />);

        await waitFor(() => {
            expect(screen.getByText(/No payment history found/i)).toBeInTheDocument();
        });
    });
});
