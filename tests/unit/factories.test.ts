import { describe, it, expect } from "vitest";
import * as factories from "../mocks/factories";
import { UserRole, ListingStatus, PlanType, PaymentStatus } from "@/lib/types";

describe("Mock Factories", () => {
    describe("createMockUser", () => {
        it("should return a valid mock user", () => {
            const user = factories.createMockUser();
            expect(user).toHaveProperty("id");
            expect(user).toHaveProperty("email");
            expect(user.role).toBe(UserRole.BUSINESS_OWNER);
        });

        it("should allow overrides", () => {
            const user = factories.createMockUser({ email: "test@example.com" });
            expect(user.email).toBe("test@example.com");
        });
    });

    describe("createMockListing", () => {
        it("should return a valid business listing", () => {
            const listing = factories.createMockListing();
            expect(listing).toHaveProperty("id");
            expect(listing).toHaveProperty("business_name");
            expect(listing.status).toBe(ListingStatus.APPROVED);
            expect(listing.tags).toBeInstanceOf(Array);
            expect(listing.operating_hours).toBeDefined();
        });

        it("should allow overrides", () => {
            const listing = factories.createMockListing({ business_name: "Overridden Name" });
            expect(listing.business_name).toBe("Overridden Name");
        });
    });

    describe("createMockCategory", () => {
        it("should return a valid category", () => {
            const category = factories.createMockCategory();
            expect(category).toHaveProperty("id");
            expect(category).toHaveProperty("name", "Restaurants");
        });
    });

    describe("createMockDeal", () => {
        it("should return a valid deal", () => {
            const deal = factories.createMockDeal();
            expect(deal).toHaveProperty("id");
            expect(deal).toHaveProperty("title");
            expect(deal.is_active).toBe(true);
        });
    });

    describe("createMockEvent", () => {
        it("should return a valid event", () => {
            const event = factories.createMockEvent();
            expect(event).toHaveProperty("id");
            expect(event).toHaveProperty("title");
            expect(event.is_featured).toBe(true);
        });
    });

    describe("createMockSubscription", () => {
        it("should return a valid subscription", () => {
            const sub = factories.createMockSubscription();
            expect(sub).toHaveProperty("id");
            expect(sub.plan_type).toBe(PlanType.PREMIUM);
        });
    });

    describe("createMockPayment", () => {
        it("should return a valid payment", () => {
            const payment = factories.createMockPayment();
            expect(payment).toHaveProperty("id");
            expect(payment.status).toBe(PaymentStatus.VERIFIED);
            expect(payment.amount).toBe(599);
        });
    });
});
