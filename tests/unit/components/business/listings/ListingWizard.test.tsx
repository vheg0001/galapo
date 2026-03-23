import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListingWizard from "@/components/business/listings/ListingWizard";
import { useListingFormStore } from "@/store/listingFormStore";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
    })),
}));

// Mock the store
vi.mock("@/store/listingFormStore", () => ({
    useListingFormStore: vi.fn(),
}));

// Mock child components
vi.mock("@/components/business/listings/StepProgress", () => ({
    default: ({ currentStep }: any) => <div data-testid="step-progress">Step {currentStep}</div>
}));

vi.mock("@/components/business/listings/CategorySelector", () => ({
    default: ({ onChange }: any) => (
        <div data-testid="category-selector">
            <button onClick={() => onChange("cat-1", "sub-1")}>Select Category</button>
        </div>
    )
}));

vi.mock("@/components/business/listings/BasicInfoForm", () => ({
    default: () => <div data-testid="basic-info-form">Basic Info</div>
}));

vi.mock("@/components/business/listings/LocationForm", () => ({
    default: () => <div data-testid="location-form">Location</div>
}));

vi.mock("@/components/business/listings/DynamicFieldsForm", () => ({
    default: () => <div data-testid="dynamic-fields-form">Dynamic Fields</div>
}));

vi.mock("@/components/business/listings/PhotoUploader", () => ({
    default: () => <div data-testid="photo-uploader">Photos</div>
}));

vi.mock("@/components/business/listings/LogoUploader", () => ({
    default: () => <div data-testid="logo-uploader">Logo</div>
}));

vi.mock("@/components/business/listings/ReviewStep", () => ({
    default: () => <div data-testid="review-step">Review</div>
}));

vi.mock("@/components/business/listings/OperatingHoursEditor", () => ({
    default: () => <div data-testid="hours-editor">Hours</div>
}));

describe("ListingWizard", () => {
    let mockState: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockState = {
            currentStep: 1,
            formData: { category_id: "", photos: [] },
            isSubmitting: false,
            isLoading: false,
            editingListingId: null,
            nextStep: vi.fn(() => mockState.currentStep++),
            prevStep: vi.fn(() => mockState.currentStep--),
            setStep: vi.fn((s) => mockState.currentStep = s),
            updateFormData: vi.fn((d) => mockState.formData = { ...mockState.formData, ...d }),
            resetForm: vi.fn(),
            loadListingData: vi.fn(),
            submitListing: vi.fn(async () => ({ success: true })),
            validateCurrentStep: vi.fn(() => true)
        };
        (useListingFormStore as any).mockImplementation(() => mockState);
    });

    it("renders step 1 by default", () => {
        render(<ListingWizard />);
        expect(screen.getByTestId("category-selector")).toBeInTheDocument();
    });

    it("cannot advance without selecting a category (if validation fails)", async () => {
        mockState.validateCurrentStep = vi.fn(() => false);
        render(<ListingWizard />);
        const continueButton = screen.getByText(/Continue/i);
        fireEvent.click(continueButton);
        expect(mockState.nextStep).not.toHaveBeenCalled();
    });

    it("advances when category is selected", async () => {
        render(<ListingWizard />);
        fireEvent.click(screen.getByText("Select Category"));
        fireEvent.click(screen.getByText(/Continue/i));
        expect(mockState.nextStep).toHaveBeenCalled();
    });

    it("navigates back when Back is clicked", () => {
        mockState.currentStep = 2;
        render(<ListingWizard />);
        fireEvent.click(screen.getByText(/Back/i));
        expect(mockState.prevStep).toHaveBeenCalled();
    });
});
