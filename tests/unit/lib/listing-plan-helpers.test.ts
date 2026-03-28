import { describe, expect, it } from "vitest";
import { deriveListingPlanTier, getListingPlanFlags } from "@/lib/listing-plan-helpers";

describe("listing-plan-helpers", () => {
    it("treats premium listings as premium even when featured is also true", () => {
        expect(
            deriveListingPlanTier({
                is_featured: true,
                is_premium: true,
            })
        ).toBe("premium");
    });

    it("returns canonical premium flags", () => {
        expect(getListingPlanFlags("premium")).toEqual({
            is_featured: true,
            is_premium: true,
        });
    });

    it("returns canonical featured flags", () => {
        expect(getListingPlanFlags("featured")).toEqual({
            is_featured: true,
            is_premium: false,
        });
    });

    it("returns canonical free flags", () => {
        expect(getListingPlanFlags("free")).toEqual({
            is_featured: false,
            is_premium: false,
        });
    });
});
