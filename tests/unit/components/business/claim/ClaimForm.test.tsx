import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ClaimForm from "@/components/business/listings/ClaimForm";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

describe("ClaimForm", () => {
    const mockListing = { id: "l1", business_name: "Test Biz", slug: "test-biz" };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("shows error if submitting without a proof file", async () => {
        const { container } = render(<ClaimForm listing={mockListing} />);

        const form = container.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText(/Please upload a proof of ownership document/i)).toBeInTheDocument();
        }, { timeout: 5000 });
    });
});
