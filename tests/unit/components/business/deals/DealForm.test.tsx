import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DealForm from "@/components/business/deals/DealForm";
import "@testing-library/jest-dom";

// Self-contained mock to bypass global setup failures on Windows
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
}));

// Mock DealCard specifically for preview
vi.mock("@/components/shared/DealCard", () => ({
    default: ({ title, businessName, discountText }: any) => (
        <div data-testid="deal-preview">
            <span>{title}</span>
            <span>{businessName}</span>
            <span>{discountText}</span>
        </div>
    )
}));

describe("DealForm", () => {
    const mockListings = [
        { id: "l1", business_name: "Bakery A", is_premium: false, is_featured: false },
        { id: "l2", business_name: "Cafe B", is_premium: true, is_featured: false },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders all required form fields", () => {
        render(<DealForm listings={mockListings} />);

        expect(screen.getByLabelText(/Target Listing/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Deal Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Discount \/ Offer Legend/i)).toBeInTheDocument();
    });

    it("pre-selects listing if only one is available", () => {
        render(<DealForm listings={[mockListings[0]]} />);
        const select = screen.getByLabelText(/Target Listing/i) as HTMLSelectElement;
        expect(select.value).toBe(mockListings[0].id);
    });

    it("updates discount text when preset buttons are clicked", () => {
        render(<DealForm listings={mockListings} />);
        const discountInput = screen.getByLabelText(/Discount \/ Offer Legend/i) as HTMLInputElement;

        const preset50 = screen.getByText("50% OFF");
        fireEvent.click(preset50);

        expect(discountInput.value).toBe("50% OFF");
    });

    it("updates live preview as form fields change", () => {
        render(<DealForm listings={mockListings} />);

        const titleInput = screen.getByLabelText(/Deal Title/i);
        fireEvent.change(titleInput, { target: { value: "Free Coffee" } });

        const preview = screen.getByTestId("deal-preview");
        expect(preview).toHaveTextContent("Free Coffee");
    });

    it("submits the form and calls the API", async () => {
        const mockPush = vi.fn();
        const { useRouter } = require("next/navigation");
        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
            refresh: vi.fn(),
        });

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<DealForm listings={mockListings} />);

        fireEvent.change(screen.getByLabelText(/Target Listing/i), { target: { value: "l1" } });
        fireEvent.change(screen.getByLabelText(/Deal Title/i), { target: { value: "Super Deal" } });
        fireEvent.change(screen.getByLabelText(/Discount \/ Offer Legend/i), { target: { value: "20% OFF" } });

        fireEvent.click(screen.getByRole("button", { name: /Publish Deal/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/business/deals", expect.objectContaining({
                method: "POST"
            }));
            expect(mockPush).toHaveBeenCalledWith("/business/deals");
        });
    });
});
