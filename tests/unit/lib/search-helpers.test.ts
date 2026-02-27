import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    parseSearchParams,
    buildFilterUrl,
    isOpenNow,
    getActiveDay,
    getPhTime,
} from "@/lib/search-helpers";

describe("search-helpers", () => {
    describe("parseSearchParams", () => {
        it("returns defaults when no params provided", () => {
            const params = new URLSearchParams();
            const result = parseSearchParams(params);

            expect(result.city).toBe("olongapo");
            expect(result.category).toBeNull();
            expect(result.subcategory).toBeNull();
            expect(result.barangay).toEqual([]);
            expect(result.q).toBeNull();
            expect(result.featuredOnly).toBe(false);
            expect(result.openNow).toBe(false);
            expect(result.sort).toBe("featured");
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it("parses all param types correctly", () => {
            const params = new URLSearchParams({
                city: "angeles",
                category: "restaurants",
                subcategory: "fast-food",
                barangay: "kalaklan,new-kalalake",
                q: "pizza",
                featured_only: "true",
                open_now: "true",
                sort: "newest",
                page: "3",
                limit: "10",
            });

            const result = parseSearchParams(params);
            expect(result.city).toBe("angeles");
            expect(result.category).toBe("restaurants");
            expect(result.subcategory).toBe("fast-food");
            expect(result.barangay).toEqual(["kalaklan", "new-kalalake"]);
            expect(result.q).toBe("pizza");
            expect(result.featuredOnly).toBe(true);
            expect(result.openNow).toBe(true);
            expect(result.sort).toBe("newest");
            expect(result.page).toBe(3);
            expect(result.limit).toBe(10);
        });

        it("clamps limit to max 50", () => {
            const params = new URLSearchParams({ limit: "100" });
            expect(parseSearchParams(params).limit).toBe(50);
        });

        it("defaults invalid sort to 'featured'", () => {
            const params = new URLSearchParams({ sort: "invalid" });
            expect(parseSearchParams(params).sort).toBe("featured");
        });

        it("defaults invalid page to 1", () => {
            const params = new URLSearchParams({ page: "-5" });
            expect(parseSearchParams(params).page).toBe(1);
        });
    });

    describe("buildFilterUrl", () => {
        it("generates correct URL with filters", () => {
            const url = buildFilterUrl("/api/listings", {
                category: "restaurants",
                sort: "newest",
                page: 2,
            });
            expect(url).toContain("category=restaurants");
            expect(url).toContain("sort=newest");
            expect(url).toContain("page=2");
        });

        it("omits default values", () => {
            const url = buildFilterUrl("/api/listings", {
                sort: "featured",
                page: 1,
                limit: 20,
            });
            // Default sort, page 1, and limit 20 should be omitted
            expect(url).toBe("/api/listings");
        });

        it("handles barangay array", () => {
            const url = buildFilterUrl("/api/listings", {
                barangay: ["kalaklan", "new-kalalake"],
            });
            expect(url).toContain("barangay=kalaklan%2Cnew-kalalake");
        });
    });

    describe("isOpenNow", () => {
        let originalDateNow: () => number;

        beforeEach(() => {
            originalDateNow = Date.now;
        });

        afterEach(() => {
            Date.now = originalDateNow;
            vi.restoreAllMocks();
        });

        it("returns false for null operating hours", () => {
            expect(isOpenNow(null)).toBe(false);
            expect(isOpenNow(undefined)).toBe(false);
        });

        it("returns false when day is closed", () => {
            const day = getActiveDay();
            expect(
                isOpenNow({
                    [day]: { is_closed: true, open: "08:00", close: "22:00" },
                })
            ).toBe(false);
        });

        it("returns true when currently within operating hours", () => {
            const day = getActiveDay();
            // Set hours to cover all-day
            expect(
                isOpenNow({
                    [day]: { is_closed: false, open: "00:00", close: "23:59" },
                })
            ).toBe(true);
        });

        it("returns false when day data is missing", () => {
            // Use a day that doesn't exist in the hours
            expect(isOpenNow({ nonexistent: { open: "08:00", close: "22:00" } })).toBe(false);
        });
    });

    describe("getActiveDay", () => {
        it("returns a valid day name", () => {
            const day = getActiveDay();
            const validDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            expect(validDays).toContain(day);
        });
    });

    describe("getPhTime", () => {
        it("returns a time string in HH:MM format", () => {
            const time = getPhTime();
            expect(time).toMatch(/^\d{2}:\d{2}$/);
        });
    });
});
