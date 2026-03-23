import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaymentReview from "@/components/admin/payments/PaymentReview";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        refresh: vi.fn(),
        push: vi.fn()
    })
}));

// Mock child components
vi.mock("@/components/admin/payments/ProofViewer", () => ({
    default: ({ url }: { url: string }) => <div data-testid="proof-viewer">{url}</div>
}));

vi.mock("@/components/admin/payments/VerifyDialog", () => ({
    default: ({ isOpen, onConfirm }: any) => isOpen ? <button data-testid="confirm-verify" onClick={onConfirm}>Confirm</button> : null
}));

const mockPayment = {
    id: "pay-1",
    amount: 1500,
    description: "Featured Plan Upgrade",
    reference_number: "REF123",
    status: "pending",
    created_at: new Date().toISOString(),
    payment_proof_url: "http://storage.com/proof.png",
    listings: { business_name: "My Business", slug: "my-biz" },
    profiles: { full_name: "John Doe", email: "john@e.com" }
};

describe("PaymentReview", () => {
    it("renders all payment and context details", () => {
        render(<PaymentReview payment={mockPayment} />);
        
        expect(screen.getByText(/Featured Plan Upgrade/i)).toBeDefined();
        expect(screen.getByText(/REF123/i)).toBeDefined();
        expect(screen.getByText(/John Doe/i)).toBeDefined();
        expect(screen.getByText(/My Business/i)).toBeDefined();
    });

    it("opens verification dialog when verify button clicked", () => {
        render(<PaymentReview payment={mockPayment} />);
        
        const verifyBtn = screen.getByRole("button", { name: /Verify & Activate/i });
        fireEvent.click(verifyBtn);
        
        expect(screen.getByTestId("confirm-verify")).toBeDefined();
    });
});
