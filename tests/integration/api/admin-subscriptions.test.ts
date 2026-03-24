import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServerSupabaseClient } from "@/lib/supabase";
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

describe("Admin Subscriptions API Integration", () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn(),
        order: vi.fn().mockReturnThis(),
        rpc: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    });

    it("GET /api/admin/subscriptions returns filtered data", async () => {
        mockSupabase.rpc.mockResolvedValue({ data: { all: 10 }, error: null });
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data: [{ id: "1" }], count: 1 } as any);

        const req = createReq("/api/admin/subscriptions?status=active");
        const res = await getSubscriptions(req);
        const json = await res.json();

        expect(json.data).toHaveLength(1);
        expect(mockSupabase.eq).toHaveBeenCalledWith("status", "active");
    });

    it("GET /api/admin/subscriptions/[id] returns detail", async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: { id: "sub-1", listing_id: "list-1" }, error: null }); // Sub
        mockSupabase.single.mockResolvedValueOnce({ data: { id: "list-1", business_name: "Biz", users: { id: "u-1" } }, error: null }); // Listing
        mockSupabase.order.mockResolvedValue({ data: [] }); // Payments & History

        const res = await getSubscriptionDetail(createReq("/api/admin/subscriptions/sub-1"), { params: Promise.resolve({ id: "sub-1" }) });
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(json.subscription.id).toBe("sub-1");
    });

    it("PUT extend increases end_date", async () => {
        const now = new Date();
        mockSupabase.single.mockResolvedValue({ data: { id: "sub-1", end_date: now.toISOString() }, error: null });
        mockSupabase.update.mockResolvedValue({ error: null });

        const res = await updateSubscription(
            createReq("/api/admin/subscriptions/sub-1", "PUT", { action: "extend", days: 10 }),
            { params: Promise.resolve({ id: "sub-1" }) }
        );

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            end_date: expect.any(String)
        }));
    });

    it("PUT cancel set status to cancelled", async () => {
        mockSupabase.single.mockResolvedValue({ data: { id: "sub-1", listing_id: "list-1" }, error: null });
        mockSupabase.update.mockResolvedValue({ error: null });

        const res = await updateSubscription(
            createReq("/api/admin/subscriptions/sub-1", "PUT", { action: "cancel", effective: "immediate" }),
            { params: Promise.resolve({ id: "sub-1" }) }
        );

        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            status: "cancelled"
        }));
    });

    it("Bulk extend updates multiple rows", async () => {
        mockSupabase.single.mockResolvedValue({ data: { id: "sub-1", listing_id: "list-1" }, error: null });
        mockSupabase.update.mockResolvedValue({ error: null });

        const res = await bulkAction(createReq("/api/admin/subscriptions/bulk", "POST", {
            action: "extend",
            subscription_ids: ["sub-1", "sub-2"],
            params: { days: 30 }
        }));
        const json = await res.json();

        expect(json.success_count).toBe(2);
    });

    it("Stats endpoint returns summary correctly", async () => {
        mockSupabase.rpc.mockResolvedValue({ data: { active: 5 }, error: null });
        mockSupabase.select.mockResolvedValue({ data: [{ amount: 100 }, { amount: 200 }] }); // Revenue

        const res = await getStats(createReq("/api/admin/subscriptions/stats"));
        const json = await res.json();

        expect(json.stats.active).toBe(5);
        expect(json.stats.total_revenue).toBe(300);
    });
});
