import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSubscriptions } from "@/app/api/admin/subscriptions/route";
import { GET as getSubscriptionDetail, PUT as updateSubscription } from "@/app/api/admin/subscriptions/[id]/route";
import { POST as bulkAction } from "@/app/api/admin/subscriptions/bulk/route";
import { GET as getStats } from "@/app/api/admin/subscriptions/stats/route";
import { NextRequest } from "next/server";

// Helper to create req
const createReq = (url: string, method = "GET", body?: any) => {
    return new NextRequest(new URL(url, "http://localhost"), {
        method,
        body: body ? JSON.stringify(body) : undefined,
    });
};

// Mock Auth Helpers to bypass checks
vi.mock("@/lib/auth-helpers", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ user: { id: "admin-1" }, profile: { role: "super_admin" } }),
    requireBusinessOwner: vi.fn().mockResolvedValue({ user: { id: "biz-1" }, profile: { role: "business_owner" } }),
}));

// Mock Admin Helpers to avoid side effects
vi.mock("@/lib/admin-helpers", () => ({
    logSubscriptionAction: vi.fn().mockResolvedValue(undefined),
    notifyOwner: vi.fn().mockResolvedValue(undefined),
}));

// Mock Supabase lib
vi.mock("@/lib/supabase", () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        then: vi.fn(),
    };
    return {
        createServerSupabaseClient: vi.fn().mockResolvedValue(mockSupabase),
        createAdminSupabaseClient: vi.fn().mockReturnValue(mockSupabase),
    };
});

describe("Admin Subscriptions API Integration", () => {
    let mockSupabase: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { createAdminSupabaseClient } = await import("@/lib/supabase");
        mockSupabase = createAdminSupabaseClient();
        
        // Setup default mock values
        mockSupabase.then.mockImplementation((cb: any) => cb({ data: [], error: null, count: 0 }));
    });

    it("GET /api/admin/subscriptions returns filtered data", async () => {
        mockSupabase.rpc.mockImplementation(() => ({
            then: (cb: any) => cb({ data: { all: 10 }, error: null })
        }));
        mockSupabase.then.mockImplementation((cb: any) => cb({ 
            data: [{ id: "sub-1", listings: { business_name: "Biz" } }], 
            count: 1 
        }));

        const req = createReq("/api/admin/subscriptions?status=active");
        const res = await getSubscriptions(req);
        const json = await res.json();

        expect(json.data).toHaveLength(1);
        expect(mockSupabase.eq).toHaveBeenCalledWith("status", "active");
    });

    it("GET /api/admin/subscriptions/[id] returns detail", async () => {
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({ data: { id: "sub-1", listing_id: "list-1" }, error: null })) // Sub
            .mockImplementationOnce((cb: any) => cb({ data: { id: "list-1", business_name: "Biz", owner_id: "u-1" }, error: null })) // Listing
            .mockImplementationOnce((cb: any) => cb({ data: [] })); // Payments & History

        const res = await getSubscriptionDetail(createReq("/api/admin/subscriptions/sub-1"), { params: Promise.resolve({ id: "sub-1" }) });
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(json.subscription.id).toBe("sub-1");
    });

    it("PUT extend increases end_date", async () => {
        const now = new Date();
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({ data: { id: "sub-1", end_date: now.toISOString() }, error: null }))
            .mockImplementationOnce((cb: any) => cb({ error: null }));

        const res = await updateSubscription(
            createReq("/api/admin/subscriptions/sub-1", "PUT", { action: "extend", days: 10 }),
            { params: Promise.resolve({ id: "sub-1" }) }
        );

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            end_date: expect.any(String)
        }));
    });

    it("PUT cancel set status to cancelled", async () => {
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({
                data: {
                    id: "sub-1",
                    listing_id: "list-1",
                    plan_type: "featured",
                    listings: { id: "list-1", owner_id: "u-1" }
                },
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({
                data: [
                    { id: "badge-featured", slug: "featured" },
                    { id: "badge-premium", slug: "premium" }
                ],
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ error: null }));

        const res = await updateSubscription(
            createReq("/api/admin/subscriptions/sub-1", "PUT", { action: "cancel", effective: "immediate" }),
            { params: Promise.resolve({ id: "sub-1" }) }
        );

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            status: "cancelled"
        }));
    });

    it("PUT upgrade promotes featured subscriptions to premium and syncs badges", async () => {
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({
                data: {
                    plan_type: "featured",
                    end_date: new Date().toISOString(),
                    listing_id: "list-1",
                    listings: { id: "list-1", owner_id: "u-1" }
                },
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({
                data: [
                    { id: "badge-featured", slug: "featured" },
                    { id: "badge-premium", slug: "premium" }
                ],
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({ error: null }));

        const res = await updateSubscription(
            createReq("/api/admin/subscriptions/sub-1", "PUT", { action: "upgrade", new_plan: "premium" }),
            { params: Promise.resolve({ id: "sub-1" }) }
        );
        const json = await res.json();
        const { logSubscriptionAction, notifyOwner } = await import("@/lib/admin-helpers");

        expect(json.success).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith("badges");
        expect(mockSupabase.from).toHaveBeenCalledWith("listing_badges");
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            plan_type: "premium"
        }));
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            is_featured: true,
            is_premium: true
        }));
        expect(mockSupabase.delete).toHaveBeenCalled();
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
            listing_id: "list-1",
            badge_id: "badge-premium"
        }));
        expect(logSubscriptionAction).toHaveBeenCalledWith(expect.objectContaining({
            subscriptionId: "sub-1",
            action: "upgraded"
        }));
        expect(notifyOwner).toHaveBeenCalledWith(expect.objectContaining({
            ownerId: "u-1",
            title: "Plan Upgraded"
        }));
    });

    it("PUT upgrade downgrades premium subscriptions to featured with downgraded labels", async () => {
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({
                data: {
                    plan_type: "premium",
                    end_date: new Date().toISOString(),
                    listing_id: "list-1",
                    listings: { id: "list-1", owner_id: "u-1" }
                },
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({
                data: [
                    { id: "badge-featured", slug: "featured" },
                    { id: "badge-premium", slug: "premium" }
                ],
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ error: null }))
            .mockImplementationOnce((cb: any) => cb({ error: null }));

        const res = await updateSubscription(
            createReq("/api/admin/subscriptions/sub-1", "PUT", { action: "upgrade", new_plan: "featured" }),
            { params: Promise.resolve({ id: "sub-1" }) }
        );
        const json = await res.json();
        const { logSubscriptionAction, notifyOwner } = await import("@/lib/admin-helpers");

        expect(json.success).toBe(true);
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            plan_type: "featured"
        }));
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            is_featured: true,
            is_premium: false
        }));
        expect(logSubscriptionAction).toHaveBeenCalledWith(expect.objectContaining({
            subscriptionId: "sub-1",
            action: "downgraded"
        }));
        expect(notifyOwner).toHaveBeenCalledWith(expect.objectContaining({
            ownerId: "u-1",
            title: "Plan Downgraded",
            message: "Your listing has been downgraded to featured."
        }));
    });

    it("Bulk extend updates multiple rows", async () => {
        // Mock chain for two iterations
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({ data: { id: "sub-1", listing_id: "list-1" }, error: null })) // Sub 1
            .mockImplementationOnce((cb: any) => cb({ data: { id: "list-1", owner_id: "u-1" }, error: null }))    // Listing 1
            .mockImplementationOnce((cb: any) => cb({ error: null }))                                        // Update 1
            .mockImplementationOnce((cb: any) => cb({ data: { id: "sub-2", listing_id: "list-2" }, error: null })) // Sub 2
            .mockImplementationOnce((cb: any) => cb({ data: { id: "list-2", owner_id: "u-2" }, error: null }))    // Listing 2
            .mockImplementationOnce((cb: any) => cb({ error: null }));                                       // Update 2

        const res = await bulkAction(createReq("/api/admin/subscriptions/bulk", "POST", {
            action: "extend",
            subscription_ids: ["sub-1", "sub-2"],
            params: { days: 30 }
        }));
        const json = await res.json();

        expect(json.success_count).toBe(2);
    });

    it("Stats endpoint returns summary correctly", async () => {
        mockSupabase.then
            .mockImplementationOnce((cb: any) => cb({
                data: [
                    { plan_type: "featured", end_date: new Date(Date.now() + 86400000).toISOString(), amount: 199 },
                    { plan_type: "featured", end_date: new Date(Date.now() + 172800000).toISOString(), amount: 199 },
                    { plan_type: "premium", end_date: new Date(Date.now() + 2592000000).toISOString(), amount: 399 },
                ],
                error: null
            }))
            .mockImplementationOnce((cb: any) => cb({ count: 0, error: null }))
            .mockImplementationOnce((cb: any) => cb({
                data: [{ amount: 100, created_at: new Date().toISOString(), subscription_id: { plan_type: "featured" } }],
                error: null
            }));

        const res = await getStats(createReq("/api/admin/subscriptions/stats"));
        const json = await res.json();

        expect(json.active_featured).toBe(2);
        expect(json.active_premium).toBe(1);
        expect(json.expiring_this_week).toBe(2);
        expect(json.active_mrr).toBe(797);
        expect(json.revenue_this_month).toBe(100);
    });
});
