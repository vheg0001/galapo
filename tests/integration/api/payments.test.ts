import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getPayments } from "@/app/api/admin/payments/route";
import { GET as getPaymentDetail } from "@/app/api/admin/payments/[id]/route";
import { POST as verifyPayment } from "@/app/api/admin/payments/[id]/verify/route";
import { POST as bulkAction } from "@/app/api/admin/payments/bulk/route";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";

function asResponse(value: Response | undefined): Response {
    expect(value).toBeDefined();
    return value as Response;
}

// Mock Auth
vi.mock("@/lib/auth-helpers", () => ({
    requireAdmin: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(),
}));

const mockAdmin = { id: "admin-123", email: "admin@example.com", role: "super_admin" };

describe("Admin Payments API Integration", () => {
    let mockSupabase: any;
    let chain: any;

    beforeEach(() => {
        vi.clearAllMocks();

        chain = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            delete: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: function(onFullfilled: any) {
                return Promise.resolve({ data: [], error: null, count: 0 }).then(onFullfilled);
            }
        };

        mockSupabase = {
            from: vi.fn().mockReturnValue(chain),
            rpc: vi.fn().mockResolvedValue({ data: { pending: 1, verified: 0, rejected: 0, all: 1 }, error: null }),
            storage: {
                from: vi.fn().mockReturnValue({
                    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "http://signed.url" }, error: null })
                })
            }
        };

        (createAdminSupabaseClient as any).mockReturnValue(mockSupabase);
        (requireAdmin as any).mockResolvedValue({ user: mockAdmin, profile: mockAdmin });
    });

    describe("GET /api/admin/payments", () => {
        it("returns all payments with counts", async () => {
            const req = new NextRequest("http://localhost/api/admin/payments");
            const res = asResponse(await getPayments(req));
            
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.payments).toBeDefined();
            expect(data.counts.pending).toBe(1);
        });
    });

    describe("GET /api/admin/payments/[id]", () => {
        it("returns payment detail with signed proof URL", async () => {
            chain.single.mockResolvedValueOnce({ 
                data: { 
                    id: "pay-1", 
                    user_id: "user-1", 
                    listing_id: "list-1",
                    payment_proof_url: "https://x.supabase.co/storage/v1/object/public/payments/proof.png",
                    profiles: { full_name: "User" },
                    listings: { business_name: "Biz" }
                }, 
                error: null 
            });

            const res = asResponse(await getPaymentDetail(new NextRequest("http://l/pay-1"), { params: Promise.resolve({ id: "pay-1" }) }));
            
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.payment.signedProofUrl).toBe("http://signed.url");
        });
    });

    describe("POST /api/admin/payments/[id]/verify", () => {
        it("verifies payment and triggers activation", async () => {
             chain.single
                .mockResolvedValueOnce({ 
                    data: { 
                        id: "pay-1", status: "pending", amount: 1000, description: "Featured Plan",
                        listing_id: "list-1", user_id: "user-1",
                        profiles: { email: "u@e.com" },
                        listings: { business_name: "Biz" },
                        subscriptions: { plan_type: "featured" },
                        subscription_id: "sub-1"
                    }, 
                    error: null 
                }) // Fetch payment
                .mockResolvedValueOnce({ data: { id: "inv-1" }, error: null }); // Insert invoice single()

            const res = asResponse(await verifyPayment(new NextRequest("http://l/pay-1/verify"), { params: Promise.resolve({ id: "pay-1" }) }));
            
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
        });
    });

    describe("POST /api/admin/payments/bulk", () => {
        it("processes multiple payments", async () => {
            const body = { payment_ids: ["p1", "p2"], action: "verify" };
            const req = new NextRequest("http://l/bulk", { method: "POST", body: JSON.stringify(body) });

            // Mock implementation for multiple calls
            const paymentData = { 
                id: "px", 
                invoice_number: "GP-202601-0001",
                status: "pending", 
                amount: 10, 
                description: "x",
                listing_id: "l1", 
                user_id: "u1",
                profiles: { email: "u@e.com" },
                listings: { business_name: "Biz" },
                subscriptions: { plan_type: "featured" },
                subscription_id: "s1"
            };

            chain.single.mockResolvedValue({ data: paymentData, error: null });
            chain.maybeSingle.mockResolvedValue({ data: null, error: null });
            chain.insert.mockImplementation(() => chain);
            chain.select.mockImplementation(() => chain);

            const res = asResponse(await bulkAction(req));
            expect(res.status).toBe(200);
            const data = await res.json();
            if (data.success_count !== 2) {
                console.log("BULK_TEST_FAILED_DATA:", JSON.stringify(data, null, 2));
            }
            expect(data.success_count).toBe(2);
        });
    });
});
