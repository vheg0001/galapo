import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/barangays/route";
import { PATCH, DELETE } from "@/app/api/admin/barangays/[id]/route";
import { NextRequest } from "next/server";
import * as adminHelpers from "@/lib/admin-helpers";
import * as supabaseLib from "@/lib/supabase";

// Mock auth
vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: vi.fn(),
}));

const mockQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
};

const mockClient = {
    from: vi.fn().mockReturnValue({
        select: vi.fn(() => mockQuery),
        insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
        update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })) })),
        delete: vi.fn(() => ({ eq: vi.fn() })),
    }),
};

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: () => mockClient,
}));

describe("Admin Barangays APIs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (adminHelpers.requireAdmin as any).mockResolvedValue({ id: "admin-uid" });
    });

    it("GET returns all with listing counts", async () => {
        // Mock simple response since the route has complex data logic internally
        mockQuery.order.mockResolvedValue({ data: [{ id: "b1", name: "B1" }], error: null });

        // Let's assume the mockClient returns this simple object for the first query
        mockClient.from.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [{ id: "b1", name: "B1" }], error: null })
            })
        } as any);

        // We also need to mock the listings count query mapping in the route
        mockClient.from.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 5, error: null })
            })
        } as any);

        const req = new NextRequest("http://localhost/api/admin/barangays");
        const res = await GET(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data[0].id).toBe("b1");
    });

    it("POST creates with unique slug", async () => {
        const payload = { name: "New area", slug: "new-area" };
        const req = new NextRequest("http://localhost/api/admin/barangays", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        // Slug check returns empty
        mockClient.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                })
            }),
            insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: "new-b1" }, error: null })
                })
            })
        } as any);

        const res = await POST(req);
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.data.id).toBe("new-b1");
    });

    it("DELETE with listings -> 409", async () => {
        const req = new NextRequest("http://localhost/api/admin/barangays/b1", { method: "DELETE" });

        mockClient.from.mockImplementation(() => ({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 10, error: null }) // 10 listings
            })
        }) as any);

        const res = await DELETE(req, { params: Promise.resolve({ id: "b1" }) });
        expect(res.status).toBe(409);
    });

    it("non-admin -> 403", async () => {
        (adminHelpers.requireAdmin as any).mockResolvedValue({ error: new Response("Unauthorized", { status: 403 }) });
        const req = new NextRequest("http://localhost/api/admin/barangays");
        const res = await GET(req);
        expect(res.status).toBe(403);
    });
});
