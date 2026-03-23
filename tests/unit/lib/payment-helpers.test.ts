import { describe, it, expect, vi, beforeEach } from "vitest";
import { activateSubscription, activateTopSearch, activateReactivation } from "@/lib/payment-helpers";

describe("payment-helpers", () => {
    let mockSupabase: any;
    let chain: any;

    beforeEach(() => {
        vi.clearAllMocks();

        chain = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation((cb: any) => Promise.resolve(cb({ error: null })))
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue(chain)
        };
    });

    describe("activateSubscription", () => {
        it("should update subscription, listing, and badges", async () => {
            // In lib/payment-helpers.ts, activateSubscription takes (supabase, subId, paymentId, listingId, planType)
            await activateSubscription(mockSupabase, "sub-1", "pay-1", "list-1", "featured");

            // Verify subscription update
            expect(mockSupabase.from).toHaveBeenCalledWith("subscriptions");
            expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
                status: "active"
            }));
            expect(chain.eq).toHaveBeenCalledWith("id", "sub-1");

            // Verify listing flags update
            expect(mockSupabase.from).toHaveBeenCalledWith("listings");
            expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
                is_featured: true,
                is_premium: false
            }));

            // Verify badge assignment
            expect(mockSupabase.from).toHaveBeenCalledWith("listing_badges");
            expect(chain.insert).toHaveBeenCalled();
        });
    });

    describe("activateTopSearch", () => {
        it("should activate placement and assign sponsored badge", async () => {
            // In lib/payment-helpers.ts, activateTopSearch takes (supabase, paymentId, listingId)
             await activateTopSearch(mockSupabase, "pay-1", "list-1");

             expect(mockSupabase.from).toHaveBeenCalledWith("top_search_placements");
             expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
                 is_active: true
             }));

             expect(mockSupabase.from).toHaveBeenCalledWith("listing_badges");
             expect(chain.insert).toHaveBeenCalled();
        });
    });

    describe("activateReactivation", () => {
        it("should update fee status and reactive listing", async () => {
            // In lib/payment-helpers.ts, activateReactivation takes (supabase, paymentId, listingId)
            await activateReactivation(mockSupabase, "pay-1", "list-1");

            expect(mockSupabase.from).toHaveBeenCalledWith("reactivation_fees");
            expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
                status: "paid"
            }));

            expect(mockSupabase.from).toHaveBeenCalledWith("listings");
            expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
                status: "approved"
            }));
        });
    });
});
