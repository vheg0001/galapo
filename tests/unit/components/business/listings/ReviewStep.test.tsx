import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReviewStep from "@/components/business/listings/ReviewStep";
import { useListingFormStore } from "@/store/listingFormStore";

// Mock the store
vi.mock("@/store/listingFormStore", () => ({
    useListingFormStore: vi.fn(),
}));

describe("ReviewStep", () => {
    const mockData = {
        business_name: "Test Business",
        category_id: "cat-1",
        subcategory_id: "sub-1",
        phone: "09123456789",
        email: "test@test.com",
        address: "123 Street",
        full_description: "Full description rendered safely",
        tags: ["Tag1"],
        photos: [{ id: "p1", preview: "url1" }]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useListingFormStore as any).mockImplementation(() => ({
            formData: mockData,
            setStep: vi.fn(),
            submitListing: vi.fn(),
            isSubmitting: false,
            editingListingId: null
        }));
    });

    it("displays the business summary", () => {
        render(<ReviewStep />);
        expect(screen.getByText(/Test Business/i)).toBeInTheDocument();
        expect(screen.getByText(/09123456789/i)).toBeInTheDocument();
        expect(screen.getByText(/test@test.com/i)).toBeInTheDocument();

        // Use a more direct way to find the photo count text
        const photoText = screen.queryByText((content) => content.includes("photos uploaded to your gallery"));
        expect(photoText).toBeInTheDocument();
        expect(photoText?.textContent).toContain("1");
    });

    it("renders description safely", () => {
        render(<ReviewStep />);
        expect(screen.getByText(/Full description rendered safely/i)).toBeInTheDocument();
    });
});
