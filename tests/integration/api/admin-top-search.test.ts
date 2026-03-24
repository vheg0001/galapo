import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServerSupabaseClient } from "@/lib/supabase";
import { GET as getPlacements, POST as createPlacement } from "@/app/api/admin/top-search/route";
import { GET as getOverview } from "@/app/api/admin/top-search/overview/route";
import { GET as getPlacementDetail, PUT as updatePlacement, DELETE as deletePlacement } from "@/app/api/admin/top-search/[id]/route";
import { GET as getStats } from "@/app/api/admin/top-search/stats/route";
import { NextRequest, NextResponse } from "next/server";

// Helper to create req
const createReq = (url: string, method = "GET", body?: any) => {
    return new NextRequest(new URL(url, "http://localhost"), {
        method,
        body: body ? JSON.stringify(body) : undefined,
    });
};

describe("Admin Top Search API Integration", () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    });

    it("GET /api/admin/top-search returns placements", async () => {
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data: [{ id: "p-1" }], count: 1 } as any);

        const res = await getPlacements(createReq("/api/admin/top-search?status=active"));
        const json = await res.json();

        expect(json.data).toHaveLength(1);
    });

    it("POST /api/admin/top-search handles manual assignment", async () => {
        // Mock conflict check: none found
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: null }); 
        mockSupabase.insert.mockResolvedValue({ data: { id: "new-p" }, error: null });
        mockSupabase.single.mockResolvedValueOnce({ data: { id: "list-1", owner_id: "u-1" }, error: null }); // Listing for notification

        const res = await createPlacement(createReq("/api/admin/top-search", "POST", {
            category_id: "cat-1",
            listing_id: "list-1",
            position: 1,
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
        }));
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("POST /api/admin/top-search blocks conflicts", async () => {
        // Mock conflict check: existing placement found
        mockSupabase.single.mockResolvedValueOnce({ data: { id: "existing" }, error: null }); 

        const res = await createPlacement(createReq("/api/admin/top-search", "POST", {
            category_id: "cat-1",
            listing_id: "list-2",
            position: 1,
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
        }));
        
        expect(res.status).toBe(409);
    });

    it("PUT /api/admin/top-search/[id] extends placement", async () => {
        mockSupabase.single.mockResolvedValue({ data: { id: "p-1", end_date: new Date().toISOString() }, error: null });
        mockSupabase.update.mockResolvedValue({ error: null });

        const res = await updatePlacement(
            createReq("/api/admin/top-search/p-1", "PUT", { action: "extend", days: 7 }),
            { params: Promise.resolve({ id: "p-1" }) }
        );

        expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("DELETE /api/admin/top-search/[id] removes and cleans badges", async () => {
        mockSupabase.single.mockResolvedValue({ data: { listing_id: "list-1" }, error: null });
        mockSupabase.delete.mockResolvedValue({ error: null });
        mockSupabase.single.mockResolvedValue({ data: { badges: ["sponsored"] }, error: null }); // Listing badges

        const res = await deletePlacement(
            createReq("/api/admin/top-search/p-1", "DELETE"),
            { params: Promise.resolve({ id: "p-1" }) }
        );

        expect(mockSupabase.delete).toHaveBeenCalled();
        expect(mockSupabase.update).toHaveBeenCalledWith({ badges: [] }); // Badge removed
    });

    it("GET /api/admin/top-search/overview returns structured slots", async () => {
        mockSupabase.select.mockResolvedValueOnce({ data: [{ id: "cat-1", name: "Food" }] }); // Categories
        mockSupabase.select.mockResolvedValueOnce({ data: [] }); // Placements

        const res = await getOverview(createReq("/api/admin/top-search/overview"));
        const json = await res.json();

        expect(json.data[0].slots).toHaveLength(3);
    });
});
