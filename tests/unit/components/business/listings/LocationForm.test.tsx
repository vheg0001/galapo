import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LocationForm from "@/components/business/listings/LocationForm";
import { useListingFormStore } from "@/store/listingFormStore";

vi.mock("@/store/listingFormStore", () => ({
    useListingFormStore: vi.fn(),
}));

describe("LocationForm", () => {
    const mockUpdateFormData = vi.fn();
    const mockFormData = {
        address: "initial address",
        lat: 14.5,
        lng: 121.0,
        barangay_id: "b1"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useListingFormStore as any).mockReturnValue({
            formData: mockFormData,
            updateFormData: mockUpdateFormData,
            errors: {},
        });
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ id: "b1", name: "Barangay 1" }]),
            })
        ) as any;
    });

    it("renders initial address", async () => {
        render(<LocationForm />);
        await waitFor(() => {
            expect(screen.getByDisplayValue("initial address")).toBeInTheDocument();
        });
    });

    it("updates address on change", async () => {
        render(<LocationForm />);

        // Wait for initial render and fetch to complete to avoid act warning
        await waitFor(() => {
            expect(screen.getByDisplayValue("initial address")).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/House No., Building Name, Street/i);

        fireEvent.change(input, { target: { value: "New Address" } });

        expect(mockUpdateFormData).toHaveBeenCalledWith({
            address: "New Address"
        });
    });
});
