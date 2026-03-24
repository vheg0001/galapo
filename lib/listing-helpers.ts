// ──────────────────────────────────────────────────────────
// GalaPo — Listing Helpers (Module 9.2)
// ──────────────────────────────────────────────────────────

import { generateSlug } from "./utils";

/**
 * Valid coordinates for Olongapo City area
 */
export const OLONGAPO_BOUNDS = {
    north: 14.95,
    south: 14.70,
    east: 120.45,
    west: 120.15,
};

/**
 * Generate a unique slug for a business listing.
 * If slug exists, appends -2, -3, etc.
 */
export function generateUniqueSlug(businessName: string, existingSlugs: string[]): string {
    const baseSlug = businessName
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");

    let slug = baseSlug;
    let counter = 2;

    while (existingSlugs.includes(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

/**
 * Validate that coordinates are within Olongapo bounds.
 */
export function validateCoordinates(lat: number, lng: number): boolean {
    return (
        lat <= OLONGAPO_BOUNDS.north &&
        lat >= OLONGAPO_BOUNDS.south &&
        lng <= OLONGAPO_BOUNDS.east &&
        lng >= OLONGAPO_BOUNDS.west
    );
}

/**
 * Detect changes in critical fields that trigger a re-approval.
 */
export function detectCriticalChanges(oldListing: any, newData: any): boolean {
    const criticalFields = [
        "business_name",
        "category_id",
        "subcategory_id",
        "address",
        "barangay_id",
    ];

    for (const field of criticalFields) {
        if (newData[field] !== undefined && newData[field] !== oldListing[field]) {
            return true;
        }
    }
    return false;
}

/**
 * Validate listing data based on core requirements and category-specific fields.
 */
export function validateListingData(data: any, categoryFields: any[] = []): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Core validation
    if (!data.business_name || data.business_name.length > 100) {
        errors.business_name = "Business name is required and must be under 100 characters.";
    }

    if (!data.short_description || data.short_description.length > 160) {
        errors.short_description = "Short description is required and must be under 160 characters.";
    }

    const phoneDigits = (data.phone || "").replace(/\D/g, ""); // strip spaces, parens, dashes
    // Accept: 09xxxxxxxxx (11d mobile), 0x xxxxxxxx (9-10d landline), +63xxxxxxxxx (12d)
    const phoneRegex = /^(0\d{8,10}|63\d{9,10})$/;
    if (!data.phone || !phoneRegex.test(phoneDigits)) {
        errors.phone = "Valid PH phone or mobile number is required.";
    }

    if (!data.category_id) {
        errors.category_id = "Category is required.";
    }

    if (!data.barangay_id) {
        errors.barangay_id = "Barangay is required.";
    }

    if (data.lat && data.lng) {
        if (!validateCoordinates(Number(data.lat), Number(data.lng))) {
            errors.location = "Coordinates must be within Olongapo city limits.";
        }
    }

    // Dynamic fields validation
    if (categoryFields.length > 0 && data.dynamic_fields) {
        categoryFields.forEach(field => {
            if (field.is_required) {
                const value = data.dynamic_fields.find((df: any) => df.field_id === field.id)?.value;
                if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                    errors[`field_${field.id}`] = `${field.field_label} is required.`;
                }
            }
        });
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Validates and formats operating hours JSONB.
 */
export function formatOperatingHours(hours: any): any {
    const defaultHours = {
        monday: { open: "08:00", close: "17:00", closed: false },
        tuesday: { open: "08:00", close: "17:00", closed: false },
        wednesday: { open: "08:00", close: "17:00", closed: false },
        thursday: { open: "08:00", close: "17:00", closed: false },
        friday: { open: "08:00", close: "17:00", closed: false },
        saturday: { open: "08:00", close: "17:00", closed: true },
        sunday: { open: "08:00", close: "17:00", closed: true },
    };

    if (!hours || typeof hours !== "object") return defaultHours;

    // Simple validation: ensure all days are present
    const days = Object.keys(defaultHours);
    const result: any = {};

    days.forEach(day => {
        if (hours[day]) {
            result[day] = {
                open: hours[day].open || "00:00",
                close: hours[day].close || "00:00",
                closed: !!hours[day].closed,
            };
        } else {
            result[day] = (defaultHours as any)[day];
        }
    });

    return result;
}
