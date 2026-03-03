import { describe, it, expect } from "vitest";
import {
    generateUniqueSlug,
    validateCoordinates,
    detectCriticalChanges,
    validateListingData,
    formatOperatingHours
} from "@/lib/listing-helpers";

describe("listing-helpers", () => {
    describe("generateUniqueSlug", () => {
        it("generates a basic slug from business name", () => {
            expect(generateUniqueSlug("Olongapo Hotel", [])).toBe("olongapo-hotel");
        });

        it("appends a counter if slug already exists", () => {
            const existing = ["olongapo-hotel"];
            expect(generateUniqueSlug("Olongapo Hotel", existing)).toBe("olongapo-hotel-2");
        });

        it("increments counter for multiple existing slugs", () => {
            const existing = ["olongapo-hotel", "olongapo-hotel-2", "olongapo-hotel-3"];
            expect(generateUniqueSlug("Olongapo Hotel", existing)).toBe("olongapo-hotel-4");
        });

        it("handles special characters", () => {
            expect(generateUniqueSlug("Cafe & Restaurant!!!", [])).toBe("cafe-restaurant");
        });
    });

    describe("validateCoordinates", () => {
        it("returns true for coordinates within Olongapo bounds", () => {
            expect(validateCoordinates(14.83, 120.28)).toBe(true);
        });

        it("returns false for coordinates outside Olongapo bounds", () => {
            // Manila coordinates
            expect(validateCoordinates(14.5995, 120.9842)).toBe(false);
        });
    });

    describe("detectCriticalChanges", () => {
        const oldListing = {
            business_name: "Old Name",
            category_id: "cat-1",
            address: "Street 1",
            short_description: "Old Desc"
        };

        it("returns true if business name changes", () => {
            expect(detectCriticalChanges(oldListing, { business_name: "New Name" })).toBe(true);
        });

        it("returns true if category changes", () => {
            expect(detectCriticalChanges(oldListing, { category_id: "cat-2" })).toBe(true);
        });

        it("returns true if address changes", () => {
            expect(detectCriticalChanges(oldListing, { address: "Street 2" })).toBe(true);
        });

        it("returns false if only non-critical fields change", () => {
            expect(detectCriticalChanges(oldListing, { short_description: "New Desc" })).toBe(false);
        });
    });

    describe("validateListingData", () => {
        const validData = {
            business_name: "Valid Business",
            short_description: "Valid short description within 160 chars.",
            phone: "09123456789",
            category_id: "cat-1",
            barangay_id: "brgy-1",
            lat: 14.83,
            lng: 120.28
        };

        it("returns isValid=true for complete data", () => {
            const { isValid } = validateListingData(validData);
            expect(isValid).toBe(true);
        });

        it("catches missing required fields", () => {
            const { isValid, errors } = validateListingData({});
            expect(isValid).toBe(false);
            expect(errors.business_name).toBeDefined();
            expect(errors.short_description).toBeDefined();
            expect(errors.phone).toBeDefined();
            expect(errors.category_id).toBeDefined();
            expect(errors.barangay_id).toBeDefined();
        });

        it("validates phone format", () => {
            const { isValid, errors } = validateListingData({ ...validData, phone: "12345" });
            expect(isValid).toBe(false);
            expect(errors.phone).toMatch(/Valid PH phone number/);
        });

        it("validates description length", () => {
            const longDesc = "a".repeat(161);
            const { isValid, errors } = validateListingData({ ...validData, short_description: longDesc });
            expect(isValid).toBe(false);
            expect(errors.short_description).toBeDefined();
        });

        it("validates dynamic fields if provided", () => {
            const categoryFields = [
                { id: "f1", field_label: "Required Field", is_required: true }
            ];
            const data = { ...validData, dynamic_fields: [{ field_id: "f1", value: "" }] };
            const { isValid, errors } = validateListingData(data, categoryFields);
            expect(isValid).toBe(false);
            expect(errors.field_f1).toBeDefined();
        });
    });

    describe("formatOperatingHours", () => {
        it("returns default hours if input is invalid", () => {
            const hours = formatOperatingHours(null);
            expect(hours.monday).toBeDefined();
            expect(hours.monday.open).toBe("08:00");
        });

        it("fills in missing days with defaults", () => {
            const hours = formatOperatingHours({ monday: { open: "09:00", close: "18:00" } });
            expect(hours.monday.open).toBe("09:00");
            expect(hours.tuesday.open).toBe("08:00"); // default
        });
    });
});
