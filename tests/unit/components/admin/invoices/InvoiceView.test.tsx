import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import InvoiceView from "@/components/admin/invoices/InvoiceView";

// Suppress jsx and global attribute warnings from styled-jsx in tests
beforeAll(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const filter = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && (
            message.includes('non-boolean attribute') ||
            message.includes('jsx') ||
            message.includes('global')
        )) {
            return true;
        }
        return false;
    };

    vi.spyOn(console, 'error').mockImplementation((...args) => {
        if (filter(...args)) return;
        originalError(...args);
    });

    vi.spyOn(console, 'warn').mockImplementation((...args) => {
        if (filter(...args)) return;
        originalWarn(...args);
    });
});

afterAll(() => {
    vi.restoreAllMocks();
});

const mockInvoice = {
    id: "inv-1",
    invoice_number: "GP-202601-0001",
    issued_at: new Date().toISOString(),
    due_date: new Date().toISOString(),
    amount: 1500,
    status: "paid",
    description: "Featured Plan",
    items: [
        { description: "Featured Plan", quantity: 1, price: 1500, amount: 1500 }
    ],
    profiles: { 
        full_name: "John Doe", 
        email: "john@example.com" 
    },
    listings: { 
        business_name: "My Business" 
    },
    payments: {
        payment_method: "gcash",
        reference_number: "REF123"
    }
};

describe("InvoiceView", () => {
    it("renders complete invoice layout", () => {
        render(<InvoiceView invoice={mockInvoice} />);
        
        expect(screen.getByText(/GP-202601-0001/i)).toBeDefined();
        expect(screen.getByText(/My Business/i)).toBeDefined();
        expect(screen.getByText(/John Doe/i)).toBeDefined();
        expect(screen.getByText(/Featured Plan/i)).toBeDefined();
        expect(screen.getAllByText(/₱1,500/i)[0]).toBeDefined();
    });

    it("shows payment status and method", () => {
        render(<InvoiceView invoice={mockInvoice} />);
        expect(screen.getAllByText(/PAID/i)[0]).toBeDefined();
        expect(screen.getByText(/gcash/i)).toBeDefined();
        expect(screen.getByText(/REF123/i)).toBeDefined();
    });
});
