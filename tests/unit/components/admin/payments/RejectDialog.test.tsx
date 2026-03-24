import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RejectDialog from "@/components/admin/payments/RejectDialog";

describe("RejectDialog", () => {
    const mockOnReject = vi.fn();
    const mockOnClose = vi.fn();

    it("requires a reason to submit", async () => {
        render(<RejectDialog isOpen={true} onConfirm={mockOnReject} onClose={mockOnClose} amount={100} businessName="Test" />);
        
        const submitBtn = screen.getByRole("button", { name: /Send Rejection/i });
        fireEvent.click(submitBtn);
        
        expect(mockOnReject).not.toHaveBeenCalled();
    });

    it("calls onConfirm with reason when submitted", async () => {
        // Ensure mock returns a promise to match component expectation
        mockOnReject.mockResolvedValue(true);
        
        render(<RejectDialog isOpen={true} onConfirm={mockOnReject} onClose={mockOnClose} amount={100} businessName="Test" />);
        
        const textarea = screen.getByPlaceholderText(/Enter detailed reason here/i);
        fireEvent.change(textarea, { target: { value: "Invalid reference number" } });
        
        const submitBtn = screen.getByRole("button", { name: /Send Rejection/i });
        fireEvent.click(submitBtn);
        
        // Use waitFor to ensure we wait for the async execution in handleConfirm
        await waitFor(() => {
            expect(mockOnReject).toHaveBeenCalledWith("Invalid reference number");
        });
        
        // Also verify that the dialog closure was triggered
        expect(mockOnClose).toHaveBeenCalled();
    });
});
