// ──────────────────────────────────────────────────────────
// GalaPo — Listing Form Store (Module 9.1)
// Manages the multi-step wizard state for create/edit listings
// ──────────────────────────────────────────────────────────

import { create } from "zustand";
import type { OperatingHours } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────

export interface MenuItemValue {
    id: string;
    name: string;
    description: string;
    price: string;
    photo_url?: string;
}

export interface PhotoUpload {
    id: string;
    file?: File;
    preview: string;
    sort_order: number;
    existing_url?: string; // for already-uploaded images in edit mode
    image_id?: string;     // database ID for existing images
}

export interface ListingFormData {
    // Step 1
    category_id: string;
    subcategory_id: string;

    // Step 2
    business_name: string;
    short_description: string;
    full_description: string;
    tags: string[];
    phone: string;
    phone_secondary: string;
    email: string;
    website: string;
    social_links: {
        facebook: string;
        instagram: string;
        tiktok: string;
    };
    payment_methods: string[];

    // Step 3
    address: string;
    barangay_id: string;
    lat: number | null;
    lng: number | null;
    operating_hours: OperatingHours;

    // Step 4
    dynamic_fields: Record<string, any>;

    // Step 5
    logo_file: File | null;
    logo_preview: string;
    logo_existing_url: string;
    photos: PhotoUpload[];
}

const DEFAULT_HOURS: OperatingHours = {
    monday: { open: "08:00", close: "17:00", closed: false },
    tuesday: { open: "08:00", close: "17:00", closed: false },
    wednesday: { open: "08:00", close: "17:00", closed: false },
    thursday: { open: "08:00", close: "17:00", closed: false },
    friday: { open: "08:00", close: "17:00", closed: false },
    saturday: { open: "08:00", close: "17:00", closed: true },
    sunday: { open: "08:00", close: "17:00", closed: true },
};

const DEFAULT_FORM_DATA: ListingFormData = {
    category_id: "",
    subcategory_id: "",
    business_name: "",
    short_description: "",
    full_description: "",
    tags: [],
    phone: "",
    phone_secondary: "",
    email: "",
    website: "",
    social_links: { facebook: "", instagram: "", tiktok: "" },
    payment_methods: [],
    address: "",
    barangay_id: "",
    lat: null,
    lng: null,
    operating_hours: DEFAULT_HOURS,
    dynamic_fields: {},
    logo_file: null,
    logo_preview: "",
    logo_existing_url: "",
    photos: [],
};

// ── Store Interface ───────────────────────────────────────

interface ListingFormState {
    currentStep: number;
    totalSteps: number;
    formData: ListingFormData;
    errors: Record<string, string>;
    isDirty: boolean;
    isSubmitting: boolean;
    isLoading: boolean;
    editingListingId: string | null; // null = create mode

    // Navigation
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;

    // Data
    updateFormData: (partial: Partial<ListingFormData>) => void;
    setFieldError: (field: string, message: string) => void;
    clearErrors: () => void;
    resetForm: () => void;
    setEditingListing: (id: string | null) => void;
    prefillFromListing: (listing: any) => void;
    loadListingData: (id: string) => Promise<void>;

    // Validation
    validateCurrentStep: () => boolean;

    // Submission
    submitListing: () => Promise<{ success: boolean; listingId?: string; error?: string }>;
    saveDraft: () => Promise<{ success: boolean; listingId?: string; error?: string }>;
}

// ── Helpers ───────────────────────────────────────────────

function buildListingPayload(formData: ListingFormData) {
    let website = formData.website.trim();
    if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
        website = `https://${website}`;
    }

    const social_links: Record<string, string> = {};
    if (formData.social_links.facebook) social_links.facebook = formData.social_links.facebook;
    if (formData.social_links.instagram) social_links.instagram = formData.social_links.instagram;
    if (formData.social_links.tiktok) social_links.tiktok = formData.social_links.tiktok;

    return {
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        business_name: formData.business_name.trim(),
        short_description: formData.short_description.trim(),
        full_description: formData.full_description.trim() || null,
        tags: formData.tags,
        phone: formData.phone.trim(),
        phone_secondary: formData.phone_secondary.trim() || null,
        email: formData.email.trim() || null,
        website: website || null,
        social_links: Object.keys(social_links).length > 0 ? social_links : null,
        payment_methods: formData.payment_methods,
        address: formData.address.trim(),
        barangay_id: formData.barangay_id || null,
        lat: formData.lat,
        lng: formData.lng,
        operating_hours: formData.operating_hours,
        dynamic_fields: Object.entries(formData.dynamic_fields).map(([field_id, value]) => ({
            field_id,
            value,
        })),
    };
}

// ── Store ─────────────────────────────────────────────────

export const useListingFormStore = create<ListingFormState>()((set, get) => ({
    currentStep: 1,
    totalSteps: 6,
    formData: DEFAULT_FORM_DATA,
    errors: {},
    isDirty: false,
    isSubmitting: false,
    isLoading: false,
    editingListingId: null,

    setStep: (step) => set({ currentStep: Math.max(1, Math.min(step, 6)) }),

    nextStep: () => {
        const { currentStep, totalSteps, validateCurrentStep } = get();
        if (!validateCurrentStep()) return;
        if (currentStep < totalSteps) {
            set({ currentStep: currentStep + 1 });
        }
    },

    prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) set({ currentStep: currentStep - 1 });
    },

    updateFormData: (partial) =>
        set((state) => ({
            formData: { ...state.formData, ...partial },
            isDirty: true,
        })),

    setFieldError: (field, message) =>
        set((state) => ({ errors: { ...state.errors, [field]: message } })),

    clearErrors: () => set({ errors: {} }),

    resetForm: () =>
        set({
            currentStep: 1,
            formData: DEFAULT_FORM_DATA,
            errors: {},
            isDirty: false,
            isSubmitting: false,
            isLoading: false,
            editingListingId: null,
        }),

    setEditingListing: (id) => set({ editingListingId: id }),

    prefillFromListing: (listing) => {
        const photos: PhotoUpload[] = (listing.images || []).map((img: any, idx: number) => ({
            id: img.id || crypto.randomUUID(),
            preview: img.image_url,
            sort_order: img.sort_order ?? idx,
            existing_url: img.image_url,
            image_id: img.id,
        }));

        const dynamic_fields: Record<string, any> = {};
        for (const fv of listing.field_values || []) {
            dynamic_fields[fv.field_id] = fv.value;
        }

        set({
            formData: {
                ...DEFAULT_FORM_DATA,
                category_id: listing.category_id ?? "",
                subcategory_id: listing.subcategory_id ?? "",
                business_name: listing.business_name ?? "",
                short_description: listing.short_description ?? "",
                full_description: listing.full_description ?? "",
                tags: listing.tags ?? [],
                phone: listing.phone ?? "",
                phone_secondary: listing.phone_secondary ?? "",
                email: listing.email ?? "",
                website: listing.website ?? "",
                social_links: {
                    facebook: listing.social_links?.facebook ?? "",
                    instagram: listing.social_links?.instagram ?? "",
                    tiktok: listing.social_links?.tiktok ?? "",
                },
                payment_methods: listing.payment_methods ?? [],
                address: listing.address ?? "",
                barangay_id: listing.barangay_id ?? "",
                lat: listing.lat ?? null,
                lng: listing.lng ?? null,
                operating_hours: listing.operating_hours ?? DEFAULT_HOURS,
                dynamic_fields,
                logo_file: null,
                logo_preview: "",
                logo_existing_url: listing.logo_url ?? "",
                photos,
            },
            isDirty: false,
            editingListingId: listing.id,
            currentStep: 1,
            isLoading: false
        });
    },

    loadListingData: async (id) => {
        set({ isLoading: true });
        try {
            const res = await fetch(`/api/business/listings/${id}`);
            if (!res.ok) throw new Error("Failed to fetch listing");
            const data = await res.json();
            get().prefillFromListing(data);
        } catch (error) {
            console.error("LoadListing error:", error);
            set({ isLoading: false });
        }
    },


    validateCurrentStep: () => {
        const { currentStep, formData } = get();
        const newErrors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!formData.category_id) {
                newErrors.category_id = "Please select a category.";
            }
        }

        if (currentStep === 2) {
            if (!formData.business_name.trim()) {
                newErrors.business_name = "Business name is required.";
            } else if (formData.business_name.length > 100) {
                newErrors.business_name = "Business name must be 100 characters or less.";
            }
            if (!formData.short_description.trim()) {
                newErrors.short_description = "Short description is required.";
            } else if (formData.short_description.length > 160) {
                newErrors.short_description = "Short description must be 160 characters or less.";
            }
            if (!formData.phone.trim()) {
                newErrors.phone = "Phone number is required.";
            }
        }

        if (currentStep === 3) {
            if (!formData.address.trim()) {
                newErrors.address = "Address is required.";
            }
        }

        const hasErrors = Object.keys(newErrors).length > 0;
        set({ errors: newErrors });
        return !hasErrors;
    },

    submitListing: async () => {
        set({ isSubmitting: true });
        const { formData, editingListingId } = get();

        try {
            const payload = buildListingPayload(formData);
            const url = editingListingId
                ? `/api/business/listings/${editingListingId}`
                : "/api/business/listings";
            const method = editingListingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, status: "pending" }),
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Failed to submit listing");

            const listingId = data.data?.id || editingListingId;

            // 1. Upload logo if new file selected
            if (formData.logo_file) {
                const logoForm = new FormData();
                logoForm.append("file", formData.logo_file);
                await fetch(`/api/business/listings/${listingId}/logo`, {
                    method: "POST",
                    body: logoForm
                });
            }

            // 2. Upload new photos
            const newPhotos = formData.photos.filter(p => p.file);
            if (newPhotos.length > 0) {
                const photoForm = new FormData();
                newPhotos.forEach(p => {
                    if (p.file) photoForm.append("images", p.file);
                });
                await fetch(`/api/business/listings/${listingId}/images`, {
                    method: "POST",
                    body: photoForm
                });
            }

            set({ isDirty: false });
            return { success: true, listingId };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            set({ isSubmitting: false });
        }
    },

    saveDraft: async () => {
        set({ isSubmitting: true });
        const { formData, editingListingId } = get();

        try {
            const payload = buildListingPayload(formData);
            const url = editingListingId
                ? `/api/business/listings/${editingListingId}`
                : "/api/business/listings";
            const method = editingListingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, status: "draft" }),
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Failed to save draft");

            set({ isDirty: false });
            return { success: true, listingId: data.data?.id || editingListingId };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            set({ isSubmitting: false });
        }
    },
}));
