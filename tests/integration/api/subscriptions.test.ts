import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSubs, POST as postUpgrade } from "@/app/api/business/subscriptions/route";
import { PUT as updateSub } from "@/app/api/business/subscriptions/[id]/route";
import { POST as renewSub } from "@/app/api/business/subscriptions/[id]/renew/route";
import { GET as getPayments } from "@/app/api/business/payments/route";
import { POST as uploadProof } from "@/app/api/business/payments/[id]/proof/route";
import { GET as getPricing } from "@/app/api/pricing/route";
import { GET as getAvailability } from "@/app/api/business/top-search/availability/route";
import { POST as purchaseTopSearch } from "@/app/api/business/top-search/route";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireBusinessOwner } from "@/lib/auth-helpers";

function asResponse(value: Response | undefined): Response {
    expect(value).toBeDefined();
    return value as Response;
}

// Mock Auth
vi.mock("@/lib/auth-helpers", () => ({
    requireBusinessOwner: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(),
}));

const mockProfile = { id: "user-123", email: "test@example.com", role: "business_owner" };

describe("Subscription API Integration", () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSupabase = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            single: vi.fn(),
            maybeSingle: vi.fn(),
            storage: {
                from: vi.fn().mockReturnValue({
                    upload: vi.fn().mockResolvedValue({ data: { path: "ok" }, error: null }),
                    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://url.com" } })
                })
            }
        };

        (createAdminSupabaseClient as any).mockReturnValue(mockSupabase);
        (requireBusinessOwner as any).mockResolvedValue({ profile: mockProfile });
    });

    describe("GET /api/business/subscriptions", () => {
        it("returns 401 if not authenticated", async () => {
            (requireBusinessOwner as any).mockResolvedValue({ error: { status: 401 } });
            const req = new Request("http://localhost/api/business/subscriptions");
            const res = asResponse(await getSubs(req as any));
            // In our implementation, requireBusinessOwner returns a Response object if error
            expect(res.status).toBe(401);
        });

        it("returns user subscriptions", async () => {
            mockSupabase.single.mockResolvedValue({ data: [], error: null }); // For initial data fetching in route
            // The route uses complex joins, we mock the result
            mockSupabase.then = (cb: any) => cb({ data: [{ id: "sub-1" }], error: null });

            const req = new Request("http://localhost/api/business/subscriptions");
            const res = asResponse(await getSubs(req as any));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
        });
    });

    describe("POST /api/business/subscriptions (Upgrade)", () => {
        it("creates pending subscription and payment", async () => {
            const body = { listing_id: "listing-1", plan_type: "premium" };
            const req = new Request("http://localhost/api/business/subscriptions", {
                method: "POST",
                body: JSON.stringify(body)
            });

            // Mock ownership check
            mockSupabase.single.mockResolvedValueOnce({ data: { id: "listing-1", owner_id: "user-123" }, error: null });
            // Mock site settings
            mockSupabase.in.mockResolvedValueOnce({ data: [{ key: "premium_listing_monthly_price", value: 599 }], error: null });
            // Mock insert subscription
            mockSupabase.single.mockResolvedValueOnce({ data: { id: "new-sub-1" }, error: null });
            // Mock insert payment
            mockSupabase.single.mockResolvedValueOnce({ data: { id: "new-pay-1" }, error: null });

            const res = asResponse(await postUpgrade(req as any));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.subscription.id).toBe("new-sub-1");
            expect(data.payment.id).toBe("new-pay-1");
            expect(mockSupabase.insert).toHaveBeenNthCalledWith(
                1,
                expect.not.objectContaining({ user_id: "user-123" })
            );
            expect(mockSupabase.insert).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    subscription_id: "new-sub-1",
                    listing_id: "listing-1",
                    user_id: "user-123",
                    payment_proof_url: "",
                })
            );
            expect(mockSupabase.insert).toHaveBeenNthCalledWith(
                2,
                expect.not.objectContaining({ plan_type: "premium" })
            );
        });

        it("returns 403 for unauthorized listing", async () => {
            const body = { listing_id: "listing-2", plan_type: "premium" };
            const req = new Request("http://localhost/api/business/subscriptions", {
                method: "POST",
                body: JSON.stringify(body)
            });

            // Mock owner mismatch
            mockSupabase.single.mockResolvedValueOnce({ data: { id: "listing-2", owner_id: "other-user" }, error: null });

            const res = asResponse(await postUpgrade(req as any));
            expect(res.status).toBe(403);
        });
    });

    describe("PUT /api/business/subscriptions/[id]", () => {
        it("cancels auto-renew", async () => {
            const req = new Request("http://localhost/api/business/subscriptions/sub-1", {
                method: "PUT",
                body: JSON.stringify({ action: "cancel_auto_renew" })
            });

            mockSupabase.single.mockResolvedValueOnce({ data: { id: "sub-1", listings: { owner_id: "user-123" } }, error: null });
            mockSupabase.update.mockResolvedValueOnce({ error: null });

            const res = asResponse(await updateSub(req as any, { params: Promise.resolve({ id: "sub-1" }) }));
            expect(res.status).toBe(200);
            expect(mockSupabase.update).toHaveBeenCalledWith({ auto_renew: false });
        });
    });

    describe("POST /api/business/payments/[id]/proof", () => {
        it("uploads proof and updates status", async () => {
            const formData = new FormData();
            formData.append("file", new File([""], "proof.png", { type: "image/png" }));
            formData.append("reference_number", "REF999");

            const req = {
                formData: vi.fn().mockResolvedValue(formData)
            };

            mockSupabase.single.mockResolvedValueOnce({ data: { id: "pay-1", user_id: "user-123", status: "pending" }, error: null });

            const res = asResponse(await uploadProof(req as any, { params: Promise.resolve({ id: "pay-1" }) }));
            expect(res.status).toBe(200);
            expect(mockSupabase.storage.from).toHaveBeenCalledWith("payments");
        });
    });

    describe("GET /api/pricing", () => {
        it("returns pricing configuration", async () => {
            mockSupabase.in.mockResolvedValueOnce({
                data: [
                    { key: "price_premium", value: 1000 },
                    {
                        key: "advertising_packages",
                        value: [
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
                        ],
                    },
                ],
                error: null
            });
            const res = await getPricing();
            const data = await res.json();
            expect(data.premium_monthly).toBe(1000);
            expect(data.advertising_packages?.[0]?.name).toBe("Featured Listing");
        });
    });

    describe("POST /api/business/top-search", () => {
        it("purchases top search slot", async () => {
            const body = { listing_id: "listing-1", category_id: "cat-1" };
            const req = new Request("http://localhost/api/business/top-search", {
                method: "POST",
                body: JSON.stringify(body)
            });

            // Mock listing ownership
            mockSupabase.single.mockResolvedValueOnce({ data: { id: "listing-1", owner_id: "user-123" }, error: null });
            // Mock availability (Slot 1 taken, Slot 2 available)
            mockSupabase.then = (cb: any) => cb({ data: [{ position: 1 }], error: null });
            // Mock pricing
            mockSupabase.in.mockResolvedValueOnce({ data: [], error: null });
            // Mock inserts
            mockSupabase.single.mockResolvedValue({ data: { id: "ok" }, error: null });

            const res = asResponse(await purchaseTopSearch(req as any));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.placement.position).toBe(2); // Lowest available
            expect(mockSupabase.insert).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    subscription_id: null,
                    listing_id: "listing-1",
                    user_id: "user-123",
                    payment_proof_url: "",
                })
            );
            expect(mockSupabase.insert).toHaveBeenNthCalledWith(
                2,
                expect.not.objectContaining({ plan_type: "top_search" })
            );
        });
    });
});
