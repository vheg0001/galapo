import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvoicesList from "@/components/business/invoices/InvoicesList";

describe("InvoicesList", () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it("renders invoices table with correct columns", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                invoices: [
                    { 
                        id: "inv-1", 
                        invoice_number: "GP-202601-0001", 
                        issued_at: new Date().toISOString(), 
                        description: "Featured", 
                        amount: 1500, 
                        status: "paid" 
                    }
                ],
                total: 1
            })
        });

        render(<InvoicesList userId="user-123" />);

        await waitFor(() => {
            expect(screen.getByText("GP-202601-0001")).toBeDefined();
            expect(screen.getByText("Featured")).toBeDefined();
            expect(screen.getByText("₱1,500")).toBeDefined();
            expect(screen.getByText("paid")).toBeDefined();
        });
    });

    it("shows empty state when no invoices", async () => {
         (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ invoices: [], total: 0 })
        });

        render(<InvoicesList userId="user-123" />);
        await waitFor(() => {
            expect(screen.getByText(/No invoices yet/i)).toBeDefined();
        });
    });
});
