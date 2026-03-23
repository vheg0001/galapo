import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UpgradeWizard from "@/components/business/subscription/UpgradeWizard";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { SubscriptionListItem, PricingResponse } from "@/lib/types";

// Mock the store
vi.mock("@/store/subscriptionStore", () => ({
    useSubscriptionStore: vi.fn(),
}));

const mockListing: SubscriptionListItem = {
    listing_id: "listing-123",
    listing_name: "Test Cafe",
    category_name: "Food",
    current_plan: "free",
    subscription: null,
    top_search_placements: [],
};

const mockPricing: PricingResponse = {
    featured_monthly: 299,
    premium_monthly: 599,
    top_search_monthly: 999,
    ad_placement_monthly: 1499,
};

function createMockStore() {
    return {
        currentStep: 2,
        selectedPlan: null,
        paymentInstructions: {
            gcash_number: "09123456789",
            gcash_name: "Galapo Test Account",
            amount: 299,
            instructions_text: "Pay here",
        },
        paymentMethod: "gcash",
        paymentProof: null,
        referenceNumber: "",
        isSubmitting: false,
        error: null,
        setSelectedListing: vi.fn(),
        setCurrentStep: vi.fn(),
        setSelectedPlan: vi.fn(),
        setPaymentMethod: vi.fn(),
        setPaymentProof: vi.fn(),
        setReferenceNumber: vi.fn(),
        initiateSubscription: vi.fn(),
        submitPayment: vi.fn(),
        nextStep: vi.fn(),
        prevStep: vi.fn(),
        resetFlow: vi.fn(),
    };
}

let mockStore = createMockStore();

describe("UpgradeWizard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = createMockStore();
        (useSubscriptionStore as any).mockReturnValue(mockStore);
    });

    it("renders Step 2: Plan Selection initially", () => {
        render(<UpgradeWizard listing={mockListing} pricing={mockPricing} />);

        expect(screen.getByText("Choose your next level")).toBeInTheDocument();
        expect(screen.getByText("Featured")).toBeInTheDocument();
        expect(screen.getByText("Premium")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continue to payment/i })).toBeDisabled();
    });

    it("proceeds from Step 2 to Step 3 after plan selection", async () => {
        mockStore.selectedPlan = "featured" as any;
        render(<UpgradeWizard listing={mockListing} pricing={mockPricing} />);

        const nextBtn = screen.getByRole("button", { name: /continue to payment/i });
        expect(nextBtn).toBeEnabled();
        
        fireEvent.click(nextBtn);
        expect(mockStore.initiateSubscription).toHaveBeenCalled();
    });

    it("renders Step 3: Payment instructions and upload", () => {
        mockStore.currentStep = 3;
        mockStore.selectedPlan = "featured" as any;
        render(<UpgradeWizard listing={mockListing} pricing={mockPricing} />);

        expect(screen.getByText("Submit Payment")).toBeInTheDocument();
        expect(screen.getByText("09123456789")).toBeInTheDocument(); // Payment instruction detail
        expect(screen.getByLabelText(/2\. Upload Proof of Payment/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /submit proof of payment/i })).toBeDisabled();
    });

    it("can go back from Step 3 to Step 2", () => {
        mockStore.currentStep = 3;
        render(<UpgradeWizard listing={mockListing} pricing={mockPricing} />);

        const backBtn = screen.getByRole("button", { name: /back/i });
        fireEvent.click(backBtn);
        expect(mockStore.prevStep).toHaveBeenCalled();
    });

    it("renders Step 4: Success state", () => {
        mockStore.currentStep = 4;
        render(<UpgradeWizard listing={mockListing} pricing={mockPricing} />);

        expect(screen.getByText("Payment Submitted!")).toBeInTheDocument();
        expect(screen.getByText("Status: Pending Verification")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /go to billing dashboard/i })).toBeInTheDocument();
    });
});
