import { describe, it, expect } from "vitest";
import {
    normalizePlanType,
    isUpgrade,
    getSubscriptionStatus,
    mapPricingSettings,
    formatPeso
} from "@/lib/subscription-helpers";
import { SubscriptionStatus } from "@/lib/types";
import { addDays, subDays } from "date-fns";

describe("Subscription Helpers", () => {
    describe("normalizePlanType", () => {
        it("normalizes valid plans", () => {
            expect(normalizePlanType("premium")).toBe("premium");
            expect(normalizePlanType("featured")).toBe("featured");
        });

        it("defaults to free for invalid or null plans", () => {
            expect(normalizePlanType(null)).toBe("free");
            expect(normalizePlanType("ultra")).toBe("free");
        });
    });

    describe("isUpgrade", () => {
        it("correctly identifies upgrades", () => {
            expect(isUpgrade("free", "featured")).toBe(true);
            expect(isUpgrade("free", "premium")).toBe(true);
            expect(isUpgrade("featured", "premium")).toBe(true);
        });

        it("rejects same plan or lower as upgrade", () => {
            expect(isUpgrade("premium", "featured")).toBe(false);
            expect(isUpgrade("premium", "premium")).toBe(false);
            expect(isUpgrade("featured", "featured")).toBe(false);
        });
    });

    describe("getSubscriptionStatus", () => {
        it("returns expired for null subscription", () => {
            expect(getSubscriptionStatus(null)).toBe("expired");
        });

        it("returns pending_payment if status is set", () => {
            expect(getSubscriptionStatus({ status: SubscriptionStatus.PENDING_PAYMENT, end_date: null })).toBe("pending_payment");
        });

        it("returns active for future dates", () => {
            const future = addDays(new Date(), 30).toISOString();
            expect(getSubscriptionStatus({ status: SubscriptionStatus.ACTIVE, end_date: future })).toBe("active");
        });

        it("returns expiring_soon within warning threshold", () => {
            const soon = addDays(new Date(), 5).toISOString();
            expect(getSubscriptionStatus({ status: SubscriptionStatus.ACTIVE, end_date: soon }, 14)).toBe("expiring_soon");
        });

        it("returns expired for past dates", () => {
            const past = subDays(new Date(), 1).toISOString();
            expect(getSubscriptionStatus({ status: SubscriptionStatus.ACTIVE, end_date: past })).toBe("expired");
        });
    });

    describe("mapPricingSettings", () => {
        it("maps settings with fallback values", () => {
            const settings = {
                featured_listing_monthly_price: 350,
                // premium missing
                top_search_monthly_price: "invalid",
            };
            const pricing = mapPricingSettings(settings);
            expect(pricing.featured_monthly).toBe(350);
            expect(pricing.premium_monthly).toBe(599); // Fallback
            expect(pricing.top_search_monthly).toBe(999); // Fallback for invalid
        });

        it("prefers new naming over legacy naming", () => {
            const settings = {
                featured_listing_monthly_price: 400,
                price_featured: 300,
            };
            const pricing = mapPricingSettings(settings);
            expect(pricing.featured_monthly).toBe(400);
        });

        it("includes advertising packages from site settings", () => {
            const packages = [
                {
                    id: "featured-tier",
                    name: "Featured Listing",
                    price: "499",
                    interval: "/mo",
                    description: "Best for growing businesses",
                    features: ["Priority placement"],
                    is_popular: true,
                    button_text: "Get Started",
                    button_link: "/register",
                },
            ];

            const pricing = mapPricingSettings({ advertising_packages: packages });

            expect(pricing.advertising_packages).toEqual(packages);
        });
    });

    describe("formatPeso", () => {
        it("formats numbers as PHP currency", () => {
            expect(formatPeso(1000)).toContain("1,000");
            // The exact format might vary slightly by environment so we check for currency and number
            expect(formatPeso(500)).toMatch(/₱\s?500/);
        });
    });
});
