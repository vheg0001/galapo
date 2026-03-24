import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as adminGet, POST as adminPost } from "@/app/api/admin/pages/route";
import { GET as adminGetOne, PATCH as adminPatch, DELETE as adminDelete } from "@/app/api/admin/pages/[id]/route";
import { GET as publicGet } from "@/app/api/pages/[slug]/route";
import { NextRequest } from "next/server";
import * as adminHelpers from "@/lib/admin-helpers";

// Mock auth
vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: vi.fn(),
}));

// Robust mock for Supabase
const createMockChain = (data: any = null, error: any = null) => {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data, error });
    chain.maybeSingle = vi.fn().mockResolvedValue({ data, error });
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.then = vi.fn().mockImplementation((onFulfilled: any) => {
        return Promise.resolve({ data, error }).then(onFulfilled);
    });
    return chain;
};

const mockClient: any = {
    from: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: () => mockClient,
    createSupabaseClient: () => mockClient,
    createServerSupabaseClient: () => Promise.resolve(mockClient),
}));

describe("Pages APIs (Admin & Public)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (adminHelpers.requireAdmin as any).mockResolvedValue({ id: "admin-uid" });
    });

    it("GET /api/admin/pages returns all pages for admin", async () => {
        const mockPages = [{ id: "p1", title: "About", slug: "about" }];
        mockClient.from.mockReturnValue(createMockChain(mockPages));

        const req = new NextRequest("http://localhost/api/admin/pages");
        const res = await adminGet(req);

        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.data.length).toBe(1);
    });

    it("admin endpoints require auth", async () => {
        (adminHelpers.requireAdmin as any).mockResolvedValue({ error: new Response("Forbidden", { status: 403 }) });

        const req = new NextRequest("http://localhost/api/admin/pages");
        const res = await adminGet(req);
        expect(res!.status).toBe(403);
    });

    it("POST /api/admin/pages CRUD works", async () => {
        const payload = { title: "Terms", slug: "terms", content: "..." };
        const req = new NextRequest("http://localhost/api/admin/pages", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        mockClient.from.mockReturnValue(createMockChain({ id: "new-p1" }));

        const res = await adminPost(req);
        expect(res!.status).toBe(201);
        const json = await res!.json();
        expect(json.data.id).toBe("new-p1");
    });

    it("public GET /api/pages/[slug] returns published page", async () => {
        const req = new NextRequest("http://localhost/api/pages/about");

        mockClient.from.mockReturnValue(createMockChain({ id: "p1", title: "About", is_published: true }));

        const res = await publicGet(req, { params: Promise.resolve({ slug: "about" }) });
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.data.title).toBe("About");
    });

    it("public GET /api/pages/[slug] returns 404 for unpublished", async () => {
        const req = new NextRequest("http://localhost/api/pages/draft");

        mockClient.from.mockReturnValue(createMockChain(null, new Error('Not found')));

        const res = await publicGet(req, { params: Promise.resolve({ slug: "draft" }) });
        expect(res!.status).toBe(404);
    });
});
