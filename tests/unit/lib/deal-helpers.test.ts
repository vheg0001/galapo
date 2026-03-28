import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getDealLimit,
    isDealActive,
    isDealVisible,
    getDealStatus,
    formatExpiryText,
    canCreateDeal
} from "../../../lib/deal-helpers";
import { PlanType, Deal } from "../../../lib/types";

// Self-contained mock to bypass global setup issues on Windows
vi.mock("../../../lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
    createAdminSupabaseClient: vi.fn(),
}));

describe("deal-helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    describe("getDealLimit", () => {
        it("returns 1 for FREE plan", () => {
            expect(getDealLimit(PlanType.FREE)).toBe(1);
        });

        it("returns 3 for FEATURED plan", () => {
            expect(getDealLimit(PlanType.FEATURED)).toBe(3);
        });

        it("returns 5 for PREMIUM plan", () => {
            expect(getDealLimit(PlanType.PREMIUM)).toBe(5);
        });

        it("defaults to 1 for unknown plan types", () => {
            expect(getDealLimit("unknown" as any)).toBe(1);
        });
    });

    describe("isDealActive", () => {
        const baseDeal: Deal = {
            id: "1",
            listing_id: "listing-1",
            title: "Test Deal",
            description: "Test Desc",
            discount_text: "10% OFF",
            image_url: null,
            terms_conditions: null,
            is_active: true,
            start_date: "2024-01-01",
            end_date: "2024-12-31",
            created_at: "2024-01-01"
        };

        it("returns false if is_active is false", () => {
            expect(isDealActive({ ...baseDeal, is_active: false })).toBe(false);
        });

        it("returns true for a currently active deal", () => {
            vi.setSystemTime(new Date("2024-06-01"));
            expect(isDealActive(baseDeal)).toBe(true);
        });

        it("returns false for a future scheduled deal", () => {
            vi.setSystemTime(new Date("2023-01-01"));
            expect(isDealActive(baseDeal)).toBe(false);
        });

        it("returns false for an expired deal", () => {
            vi.setSystemTime(new Date("2025-01-01"));
            expect(isDealActive(baseDeal)).toBe(false);
        });
    });

    describe("isDealVisible", () => {
        const baseDeal: Deal = {
            id: "1",
            listing_id: "listing-1",
            title: "Test Deal",
            description: "Test Desc",
            discount_text: "10% OFF",
            image_url: null,
            terms_conditions: null,
            is_active: true,
            start_date: "2024-06-01",
            end_date: "2024-12-31",
            created_at: "2024-01-01"
        };

        it("returns false if is_active is false", () => {
            expect(isDealVisible({ ...baseDeal, is_active: false })).toBe(false);
        });

        it("returns true for a currently active deal", () => {
            vi.setSystemTime(new Date("2024-07-01"));
            expect(isDealVisible(baseDeal)).toBe(true);
        });

        it("returns true for a deal starting in 15 days", () => {
            vi.setSystemTime(new Date("2024-05-17"));
            expect(isDealVisible(baseDeal)).toBe(true);
        });

        it("returns true for a deal starting exactly 1 month from now", () => {
            vi.setSystemTime(new Date("2024-05-01"));
            expect(isDealVisible(baseDeal)).toBe(true);
        });

        it("returns false for a deal starting in 2 months", () => {
            vi.setSystemTime(new Date("2024-04-01"));
            expect(isDealVisible(baseDeal)).toBe(false);
        });

        it("returns false for an expired deal", () => {
            vi.setSystemTime(new Date("2025-01-01"));
            expect(isDealVisible(baseDeal)).toBe(false);
        });
    });

    describe("getDealStatus", () => {
        const baseDeal: Deal = {
            id: "1",
            listing_id: "listing-1",
            title: "Test Deal",
            description: "Test Desc",
            discount_text: "10% OFF",
            is_active: true,
            start_date: "2024-01-01",
            end_date: "2024-12-31",
            created_at: "2024-01-01",
            image_url: null
        };

        it("returns 'inactive' if is_active is false", () => {
            expect(getDealStatus({ ...baseDeal, is_active: false })).toBe("inactive");
        });

        it("returns 'scheduled' if now < start_date", () => {
            vi.setSystemTime(new Date("2023-01-01"));
            expect(getDealStatus(baseDeal)).toBe("scheduled");
        });

        it("returns 'expired' if now > end_date", () => {
            vi.setSystemTime(new Date("2025-01-01"));
            expect(getDealStatus(baseDeal)).toBe("expired");
        });

        it("returns 'active' if within date range", () => {
            vi.setSystemTime(new Date("2024-06-01"));
            expect(getDealStatus(baseDeal)).toBe("active");
        });
    });

    describe("formatExpiryText", () => {
        it("returns 'Expired' for past dates", () => {
            vi.setSystemTime(new Date("2024-01-02"));
            expect(formatExpiryText("2024-01-01")).toBe("Expired");
        });

        it("returns 'Ends in X days' for multi-day expiry", () => {
            vi.setSystemTime(new Date("2024-01-01"));
            expect(formatExpiryText("2024-01-05")).toBe("Ends in 4 days");
        });

        it("returns 'Ends in 1 day' for single-day expiry", () => {
            vi.setSystemTime(new Date("2024-01-01T12:00:00"));
            expect(formatExpiryText("2024-01-02T13:00:00")).toBe("Ends in 1 day");
        });

        it("returns 'Ends in X hours' for sub-24h expiry", () => {
            vi.setSystemTime(new Date("2024-01-01T10:00:00"));
            expect(formatExpiryText("2024-01-01T15:00:00")).toBe("Ends in 5 hours");
        });

        it("returns 'Ends very soon' for sub-1h expiry", () => {
            vi.setSystemTime(new Date("2024-01-01T10:00:00"));
            expect(formatExpiryText("2024-01-01T10:30:00")).toBe("Ends very soon");
        });
    });

    describe("canCreateDeal", () => {
        const createMockSupabase = () => {
            const mock: any = {
                from: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn(),
                gte: vi.fn().mockReturnThis(),
            };
            mock.from.mockReturnValue(mock);
            mock.select.mockReturnValue(mock);
            mock.eq.mockReturnValue(mock);
            mock.gte.mockReturnValue(mock);
            return mock;
        };

        const userId = "user-123";
        const listingId = "listing-456";

        it("returns allowed:false if listing not found", async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

            const result = await canCreateDeal(mockSupabase, listingId, userId);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("Listing not found");
        });

        it("returns allowed:false if user is not the owner", async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: listingId, owner_id: "other-user", status: "approved", is_active: true }
            });

            const result = await canCreateDeal(mockSupabase, listingId, userId);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe("You do not own this listing");
        });

        it("returns allowed:false if listing is not approved", async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: listingId, owner_id: userId, status: "pending", is_active: true }
            });

            const result = await canCreateDeal(mockSupabase, listingId, userId);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("must be approved");
        });

        it("returns allowed:true if under limit for FREE plan", async () => {
            const mockSupabase = createMockSupabase();
            // First call for listing check
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: listingId, owner_id: userId, status: "approved", is_active: true }
            });
            // Second call for count check
            mockSupabase.gte.mockResolvedValueOnce({ count: 0, error: null });

            const result = await canCreateDeal(mockSupabase, listingId, userId);
            expect(result.allowed).toBe(true);
            expect(result.plan).toBe(PlanType.FREE);
            expect(result.limit).toBe(1);
        });

        it("returns allowed:false if limit reached", async () => {
            const mockSupabase = createMockSupabase();
            // First call for listing check (Premium)
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: listingId, owner_id: userId, status: "approved", is_active: true, is_premium: true }
            });
            // Second call for count check (5 active deals)
            mockSupabase.gte.mockResolvedValueOnce({ count: 5, error: null });

            const result = await canCreateDeal(mockSupabase, listingId, userId);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("limit reached");
            expect(result.limit).toBe(5);
        });
    });
});
