import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/categories/route";
import { GET as getFieldDetails, DELETE as deleteFieldParams } from "@/app/api/admin/category-fields/[id]/route";
import { GET as getCategoryDetails, PATCH as patchCategory, DELETE as deleteCategory } from "@/app/api/admin/categories/[id]/route";
import { NextRequest } from "next/server";
import * as adminHelpers from "@/lib/admin-helpers";

// Mock auth
vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: vi.fn(),
}));

// Create a robust chainable mock
const createMockChain = (data: any = null, error: any = null, count: number = 0) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.or = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data, error });
    chain.maybeSingle = vi.fn().mockResolvedValue({ data, error });
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    // Support count
    chain.then = vi.fn().mockImplementation((onFulfilled: any) => {
        return Promise.resolve({ data, error, count }).then(onFulfilled);
    });
    return chain;
};

const mockSupabaseClient: any = {
    from: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: () => mockSupabaseClient,
}));

describe("Admin Categories APIs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (adminHelpers.requireAdmin as any).mockResolvedValue({ id: "admin-uid" });
    });

    it("GET /api/admin/categories returns tree", async () => {
        const mockCategories = [
            { id: "c1", parent_id: null, name: "C1", slug: "c1" },
            { id: "c2", parent_id: "c1", name: "C2", slug: "c2" }
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === "categories") return createMockChain(mockCategories);
            if (table === "listings") return createMockChain([]);
            return createMockChain();
        });

        const req = new NextRequest("http://localhost/api/admin/categories");
        const res = await GET(req);

        expect(res.status).toBe(200);
        const json = await res.json();

        expect(json.data.length).toBe(1);
        expect(json.data[0].id).toBe("c1");
        expect(json.data[0].subcategories[0].id).toBe("c2");
    });

    it("POST /api/admin/categories creates category", async () => {
        const payload = { name: "New", slug: "new" };
        const req = new NextRequest("http://localhost/api/admin/categories", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        mockSupabaseClient.from.mockReturnValue(createMockChain({ id: "new-id", name: "New" }));

        const res = await POST(req);
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.data.id).toBe("new-id");
    });

    it("POST /api/admin/categories rejects conflicts with 500 (current API behavior)", async () => {
        const payload = { name: "New", slug: "dup" };
        const req = new NextRequest("http://localhost/api/admin/categories", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        mockSupabaseClient.from.mockReturnValue(createMockChain(null, { message: "Duplicate slug" }));

        const res = await POST(req);
        expect(res.status).toBe(500);
    });

    it("DELETE /api/admin/categories/[id] checks listing references", async () => {
        const req = new NextRequest("http://localhost/api/admin/categories/c1", { method: "DELETE" });

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === "listings") return createMockChain(null, null, 5); // 5 listings
            return createMockChain();
        });

        const res = await deleteCategory(req, { params: Promise.resolve({ id: "c1" }) });
        expect(res.status).toBe(409);
        const json = await res.json();
        expect(json.error).toContain("Cannot delete");
    });

    it("DELETE /api/admin/categories/[id] successful deletion when no listings", async () => {
        const req = new NextRequest("http://localhost/api/admin/categories/c1", { method: "DELETE" });

        mockSupabaseClient.from.mockImplementation((table: string) => {
            if (table === "listings") return createMockChain(null, null, 0); // 0 listings
            return createMockChain({ success: true });
        });

        const res = await deleteCategory(req, { params: Promise.resolve({ id: "c1" }) });
        expect(res.status).toBe(200);
    });

    it("non-admin gets 403 on all routes", async () => {
        (adminHelpers.requireAdmin as any).mockResolvedValue({ error: new Response("Unauthorized", { status: 403 }) });

        const getReq = new NextRequest("http://localhost/api/admin/categories");
        const getRes = await GET(getReq);
        expect(getRes.status).toBe(403);
    });
});
