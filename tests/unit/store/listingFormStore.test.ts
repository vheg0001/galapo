import { describe, it, expect, beforeEach, vi } from "vitest";
import { useListingFormStore } from "@/store/listingFormStore";

// Mock fetch for submission tests
global.fetch = vi.fn();

describe("listingFormStore", () => {
    beforeEach(() => {
        useListingFormStore.getState().resetForm();
        vi.clearAllMocks();
    });

    it("initializes with default state", () => {
        const state = useListingFormStore.getState();
        expect(state.currentStep).toBe(1);
        expect(state.formData.business_name).toBe("");
        expect(state.isDirty).toBe(false);
    });

    it("updates form data and tracks dirty state", () => {
        const { updateFormData } = useListingFormStore.getState();
        updateFormData({ business_name: "New Business" });

        const state = useListingFormStore.getState();
        expect(state.formData.business_name).toBe("New Business");
        expect(state.isDirty).toBe(true);
    });

    it("navigates through steps correctly", () => {
        const { setStep, nextStep, prevStep, updateFormData } = useListingFormStore.getState();

        // Cannot go to next step without category
        nextStep();
        expect(useListingFormStore.getState().currentStep).toBe(1);

        // Select category
        updateFormData({ category_id: "cat-1" });
        nextStep();
        expect(useListingFormStore.getState().currentStep).toBe(2);

        prevStep();
        expect(useListingFormStore.getState().currentStep).toBe(1);

        setStep(3);
        expect(useListingFormStore.getState().currentStep).toBe(3);
    });

    describe("validation", () => {
        it("validates step 1: category required", () => {
            const { validateCurrentStep, updateFormData } = useListingFormStore.getState();

            expect(validateCurrentStep()).toBe(false);
            expect(useListingFormStore.getState().errors.category_id).toBeDefined();

            updateFormData({ category_id: "cat-1" });
            expect(validateCurrentStep()).toBe(true);
        });

        it("validates step 2: business name and short description", () => {
            const { setStep, validateCurrentStep, updateFormData } = useListingFormStore.getState();
            setStep(2);

            expect(validateCurrentStep()).toBe(false);

            updateFormData({
                business_name: "Test",
                short_description: "Desc",
                phone: "09123456789"
            });
            expect(validateCurrentStep()).toBe(true);
        });
    });

    it("resets form state", () => {
        const { updateFormData, resetForm } = useListingFormStore.getState();
        updateFormData({ business_name: "Dirty" });
        resetForm();

        const state = useListingFormStore.getState();
        expect(state.formData.business_name).toBe("");
        expect(state.isDirty).toBe(false);
        expect(state.currentStep).toBe(1);
    });
});
