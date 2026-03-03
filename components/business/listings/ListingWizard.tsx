"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ListingWizard Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useListingFormStore } from "@/store/listingFormStore";
import StepProgress from "./StepProgress";
import CategorySelector from "./CategorySelector";
import BasicInfoForm from "./BasicInfoForm";
import LocationForm from "./LocationForm";
import DynamicFieldsForm from "./DynamicFieldsForm";
import PhotoUploader from "./PhotoUploader";
import LogoUploader from "./LogoUploader";
import ReviewStep from "./ReviewStep";
import OperatingHoursEditor from "./OperatingHoursEditor";
import { ChevronLeft, ChevronRight, Save, Loader2, AlertTriangle } from "lucide-react";

interface ListingWizardProps {
    listingId?: string; // If provided, we are in edit mode
}

export default function ListingWizard({ listingId }: ListingWizardProps) {
    const router = useRouter();
    const {
        currentStep,
        formData,
        isSubmitting,
        isLoading,
        editingListingId,
        setStep,
        nextStep,
        prevStep,
        updateFormData,
        resetForm,
        loadListingData,
        submitListing,
        validateCurrentStep
    } = useListingFormStore();

    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Initial load
    useEffect(() => {
        resetForm();
        if (listingId) {
            loadListingData(listingId);
        }
    }, [listingId, resetForm, loadListingData]);

    // Unsaved changes prevention
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (unsavedChanges) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [unsavedChanges]);

    const handleNext = async () => {
        if (validateCurrentStep()) {
            nextStep();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleBack = () => {
        prevStep();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        const { success } = await submitListing();
        if (success) {
            setUnsavedChanges(false);
            router.push("/business/listings?success=true");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-[#FF6B35]" />
                <p className="text-sm font-medium text-gray-500">Loading listing data...</p>
            </div>
        );
    }

    const isEditMode = !!editingListingId;

    return (
        <div className="mx-auto max-w-5xl space-y-10 py-6 px-4">
            {/* Wizard Header */}
            <div className="sticky top-0 z-40 -mx-4 bg-white/80 px-4 py-4 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:border-gray-100 sm:px-8 sm:shadow-sm">
                <StepProgress currentStep={currentStep} onStepClick={setStep} />
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mx-auto max-w-3xl space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900">Select Business Category</h2>
                                <p className="text-sm text-gray-500">Choose the best fit for your business to help customers find you.</p>
                            </div>
                            <CategorySelector
                                value={formData.category_id}
                                subValue={formData.subcategory_id || ""}
                                onChange={(cat, sub) => {
                                    updateFormData({ category_id: cat, subcategory_id: sub });
                                    setUnsavedChanges(true);
                                }}
                            />
                        </div>
                    </div>
                )}

                {currentStep === 2 && <BasicInfoForm />}

                {currentStep === 3 && <LocationForm />}

                {currentStep === 4 && (
                    <div className="mx-auto max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">Additional Details</h2>
                            <p className="text-sm text-gray-500">Helpful info like hours, ameneties, and specific attributes.</p>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Operating Hours</h3>
                                <OperatingHoursEditor
                                    value={formData.operating_hours || {
                                        monday: { open: "08:00", close: "17:00", closed: false },
                                        tuesday: { open: "08:00", close: "17:00", closed: false },
                                        wednesday: { open: "08:00", close: "17:00", closed: false },
                                        thursday: { open: "08:00", close: "17:00", closed: false },
                                        friday: { open: "08:00", close: "17:00", closed: false },
                                        saturday: { open: "08:00", close: "17:00", closed: true },
                                        sunday: { open: "08:00", close: "17:00", closed: true }
                                    }}
                                    onChange={(hours) => {
                                        updateFormData({ operating_hours: hours });
                                        setUnsavedChanges(true);
                                    }}
                                />
                            </div>

                            <div className="pt-8 border-t border-gray-50">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">Category Specific Fields</h3>
                                <DynamicFieldsForm
                                    categoryId={formData.category_id}
                                    subcategoryId={formData.subcategory_id}
                                    values={formData.dynamic_fields || {}}
                                    onChange={(fields) => {
                                        updateFormData({ dynamic_fields: fields });
                                        setUnsavedChanges(true);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="mx-auto max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900">Photos & Branding</h2>
                            <p className="text-sm text-gray-500">High quality images get 3x more customers.</p>
                        </div>

                        <div className="space-y-10">
                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <LogoUploader
                                    url={formData.logo_existing_url}
                                    onChange={(file, url) => {
                                        updateFormData({ logo_file: file, logo_preview: url });
                                        setUnsavedChanges(true);
                                    }}
                                />
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <PhotoUploader
                                    photos={formData.photos.map((p: any) => ({
                                        id: p.id,
                                        url: p.preview || p.existing_url,
                                        isPrimary: p.sort_order === 0
                                    }))}
                                    onChange={(photos) => {
                                        updateFormData({
                                            photos: photos.map((p, idx) => ({
                                                id: p.id,
                                                preview: p.url,
                                                sort_order: idx,
                                                file: p.file
                                            }))
                                        });
                                        setUnsavedChanges(true);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 6 && <ReviewStep />}
            </div>

            {/* Navigation Footer */}
            <div className="sticky bottom-0 z-40 -mx-4 flex items-center justify-between border-t border-gray-100 bg-white/95 px-6 py-5 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:shadow-lg">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 1 || isSubmitting}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-30"
                >
                    <ChevronLeft size={18} />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    {/* Draft save button */}
                    <button
                        type="button"
                        onClick={() => { }} // TODO
                        className="hidden sm:flex items-center gap-1.5 px-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
                    >
                        <Save size={14} />
                        Save Draft
                    </button>

                    {currentStep < 6 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 rounded-xl bg-[#FF6B35] px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/20 transition hover:bg-[#FF6B35]/90 active:scale-95"
                        >
                            Continue
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-xl bg-[#00A86B] px-10 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00A86B]/20 transition hover:bg-[#00A86B]/90 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {isEditMode ? "Save Changes" : "Submit Listing"}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}
