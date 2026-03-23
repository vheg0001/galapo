import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateInvoiceNumber, formatInvoiceData, calculateInvoiceItems } from "@/lib/invoice-helpers";
import { format } from "date-fns";

describe("invoice-helpers", () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("generateInvoiceNumber", () => {
        it("should generate the first invoice number for the month", async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: null });
            
            const result = await generateInvoiceNumber(mockSupabase);
            const expectedPrefix = `GP-${format(new Date(), "yyyyMM")}`;
            expect(result).toBe(`${expectedPrefix}-0001`);
        });

        it("should increment the sequence for existing invoices", async () => {
            const expectedPrefix = `GP-${format(new Date(), "yyyyMM")}`;
            mockSupabase.maybeSingle.mockResolvedValue({ 
                data: { invoice_number: `${expectedPrefix}-0042` } 
            });
            
            const result = await generateInvoiceNumber(mockSupabase);
            expect(result).toBe(`${expectedPrefix}-0043`);
        });
    });

    describe("calculateInvoiceItems", () => {
        it("should format items correctly from payment", () => {
            const payment = { description: "Featured Plan", amount: 1500 };
            const items = calculateInvoiceItems(payment);
            
            expect(items).toHaveLength(1);
            expect(items[0]).toEqual({
                description: "Featured Plan",
                quantity: 1,
                price: 1500,
                amount: 1500
            });
        });
    });

    describe("formatInvoiceData", () => {
        it("should return a complete invoice object", () => {
            const payment = { description: "Premium Plan", amount: 3000, payment_method: "gcash", reference_number: "REF123" };
            const listing = { business_name: "Test Biz" };
            const owner = { full_name: "John Doe", email: "john@example.com" };
            const invoiceNumber = "GP-202601-0001";

            const result = formatInvoiceData(payment, invoiceNumber, listing, owner);

            expect(result.invoiceNumber).toBe(invoiceNumber);
            expect(result.businessName).toBe("Test Biz");
            expect(result.ownerName).toBe("John Doe");
            expect(result.total).toBe(3000);
            expect(result.paymentMethod).toBe("gcash");
            expect(result.referenceNumber).toBe("REF123");
        });
    });
});
