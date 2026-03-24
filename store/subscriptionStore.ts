import { create } from "zustand";
import type {
    Category,
    PaymentInstructionsConfig,
    PlanTier,
    SubscriptionListItem,
} from "@/lib/types";

type FlowType = "subscription" | "top_search" | null;
type PaymentMethodOption = "gcash" | "bank_transfer";

export interface SubscriptionStoreState {
    selectedListing: SubscriptionListItem | null;
    selectedPlan: PlanTier | null;
    selectedTopSearchCategory: Category | null;
    selectedPosition: number | null;
    paymentProof: File | null;
    referenceNumber: string;
    paymentMethod: PaymentMethodOption;
    currentStep: number;
    isSubmitting: boolean;
    currentPaymentId: string | null;
    currentTargetId: string | null;
    currentFlow: FlowType;
    paymentInstructions: PaymentInstructionsConfig | null;
    confirmationMessage: string | null;
    error: string | null;
    setSelectedListing: (listing: SubscriptionListItem | null) => void;
    setSelectedPlan: (plan: PlanTier | null) => void;
    setSelectedTopSearchCategory: (category: Category | null) => void;
    setSelectedPosition: (position: number | null) => void;
    setPaymentProof: (file: File | null) => void;
    setReferenceNumber: (referenceNumber: string) => void;
    setPaymentMethod: (method: PaymentMethodOption) => void;
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    initiateSubscription: () => Promise<any>;
    initiateTopSearch: () => Promise<any>;
    initiateRenewal: (subscriptionId: string) => Promise<any>;
    submitPayment: () => Promise<any>;
    setPaymentInstructions: (instructions: PaymentInstructionsConfig | null) => void;
    resetFlow: () => void;
}

const initialState = {
    selectedListing: null,
    selectedPlan: null,
    selectedTopSearchCategory: null,
    selectedPosition: null,
    paymentProof: null,
    referenceNumber: "",
    paymentMethod: "gcash" as PaymentMethodOption,
    currentStep: 1,
    isSubmitting: false,
    currentPaymentId: null,
    currentTargetId: null,
    currentFlow: null as FlowType,
    paymentInstructions: null,
    confirmationMessage: null,
    error: null,
};

export const useSubscriptionStore = create<SubscriptionStoreState>()((set, get) => ({
    ...initialState,

    setSelectedListing: (listing) => set({ selectedListing: listing, error: null }),
    setSelectedPlan: (plan) => set({ selectedPlan: plan, error: null }),
    setSelectedTopSearchCategory: (category) => set({ selectedTopSearchCategory: category, error: null }),
    setSelectedPosition: (position) => set({ selectedPosition: position, error: null }),
    setPaymentProof: (file) => set({ paymentProof: file, error: null }),
    setReferenceNumber: (referenceNumber) => set({ referenceNumber }),
    setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
    setCurrentStep: (currentStep) => set({ currentStep }),
    nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
    prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

    initiateSubscription: async () => {
        const { selectedListing, selectedPlan } = get();
        if (!selectedListing?.listing_id || !selectedPlan || selectedPlan === "free") {
            throw new Error("Please select a listing and paid plan first.");
        }

        set({ isSubmitting: true, error: null, confirmationMessage: null });

        try {
            const response = await fetch("/api/business/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    listing_id: selectedListing.listing_id,
                    plan_type: selectedPlan,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Failed to initiate subscription.");
            }

            set({
                currentFlow: "subscription",
                currentTargetId: payload.subscription?.id ?? null,
                currentPaymentId: payload.payment?.id ?? null,
                paymentInstructions: payload.payment_instructions ?? null,
                currentStep: 3,
            });

            return payload;
        } finally {
            set({ isSubmitting: false });
        }
    },

    initiateTopSearch: async () => {
        const { selectedListing, selectedTopSearchCategory, selectedPosition } = get();
        if (!selectedListing?.listing_id || !selectedTopSearchCategory?.id || !selectedPosition) {
            throw new Error("Please select a listing, category, and position first.");
        }

        set({ isSubmitting: true, error: null, confirmationMessage: null });

        try {
            const response = await fetch("/api/business/top-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    listing_id: selectedListing.listing_id,
                    category_id: selectedTopSearchCategory.id,
                    position: selectedPosition,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Failed to initiate top search placement.");
            }

            set({
                currentFlow: "top_search",
                currentTargetId: payload.placement?.id ?? null,
                currentPaymentId: payload.payment?.id ?? null,
                paymentInstructions: payload.payment_instructions ?? null,
                currentStep: 6,
            });

            return payload;
        } finally {
            set({ isSubmitting: false });
        }
    },

    initiateRenewal: async (subscriptionId: string) => {
        set({ isSubmitting: true, error: null, confirmationMessage: null });

        try {
            const response = await fetch(`/api/business/subscriptions/${subscriptionId}/renew`, {
                method: "POST",
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Failed to initiate renewal.");
            }

            set({
                currentFlow: "subscription",
                currentTargetId: payload.subscription_id ?? subscriptionId,
                currentPaymentId: payload.payment?.id ?? null,
                paymentInstructions: payload.payment_instructions ?? null,
                currentStep: 3, // Go to payment step
            });

            return payload;
        } finally {
            set({ isSubmitting: false });
        }
    },

    submitPayment: async () => {
        const { currentTargetId, currentPaymentId, paymentProof, referenceNumber, paymentMethod, currentFlow } = get();
        if (!currentTargetId || !paymentProof) {
            throw new Error("Upload your payment proof before submitting.");
        }

        set({ isSubmitting: true, error: null });

        try {
            const formData = new FormData();
            formData.append("file", paymentProof);
            formData.append("reference_number", referenceNumber);
            formData.append("payment_method", paymentMethod);
            formData.append("target_id", currentTargetId);
            formData.append("payment_type", currentFlow === "top_search" ? "top_search" : "subscription");

            const endpoint = currentPaymentId
                ? `/api/business/payments/${currentPaymentId}/proof`
                : `/api/business/payments/proof`;

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Failed to upload payment proof.");
            }

            set({
                currentPaymentId: currentPaymentId ?? payload.payment_id ?? null,
                currentStep: currentFlow === "top_search" ? 7 : 4,
                confirmationMessage:
                    currentFlow === "top_search"
                        ? "Your Top Search placement request is pending verification."
                        : "Your payment is pending verification.",
            });

            return payload;
        } finally {
            set({ isSubmitting: false });
        }
    },

    setPaymentInstructions: (paymentInstructions) => set({ paymentInstructions }),
    resetFlow: () => set({ ...initialState }),
}));