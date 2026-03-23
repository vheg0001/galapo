import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/business/listings/route";
import { PUT, DELETE } from "@/app/api/business/listings/[id]/route";

// Create a robust mock factory
const createMockSupabase = () => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation(function (onFulfilled) {
            return Promise.resolve({ data: [], error: null }).then(onFulfilled);
        }),
    };

    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "mock-user-id" } }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "mock-user-id" } } }, error: null }),
        },
        from: vi.fn(() => chain),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        _chain: chain
    };
};

const globalMockSupabase = createMockSupabase();

vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(() => Promise.resolve(globalMockSupabase)),
    createAdminSupabaseClient: vi.fn(() => globalMockSupabase),
}));

describe("Listing CRUD API", () => {
    const userId = "mock-user-id";
    const listingId = "list-456";

    beforeEach(() => {
        // Use mockReset (not clearAllMocks) to flush any pending mockResolvedValueOnce queues
        globalMockSupabase.auth.getUser.mockReset();
        globalMockSupabase.auth.getSession.mockReset();
        globalMockSupabase._chain.maybeSingle.mockReset();
        globalMockSupabase._chain.single.mockReset();
        globalMockSupabase._chain.then.mockReset();
        globalMockSupabase._chain.select.mockReset().mockReturnThis();
        globalMockSupabase._chain.eq.mockReset().mockReturnThis();
        globalMockSupabase._chain.neq.mockReset().mockReturnThis();
        globalMockSupabase._chain.ilike.mockReset().mockReturnThis();
        globalMockSupabase._chain.limit.mockReset().mockReturnThis();

        // Restore default behaviors
        globalMockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
        globalMockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: userId } } }, error: null });
        globalMockSupabase._chain.maybeSingle.mockResolvedValue({ data: { id: listingId, owner_id: userId }, error: null });
        globalMockSupabase._chain.single.mockResolvedValue({ data: { id: listingId, owner_id: userId }, error: null });
        globalMockSupabase._chain.then.mockImplementation((onFulfilled: any) =>
            onFulfilled({ data: [], error: null })
        );
    });

    it("returns 401 if unauthorized", async () => {
        globalMockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        globalMockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

        const res = await POST(new Request("http://localhost/api/business/listings", {
            method: "POST"
        }) as any);
        expect(res.status).toBe(401);
    });

    it("creates a new listing", async () => {
        // Mock chain for slug check (maybeSingle returning null)
        globalMockSupabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        // Mock chain for insert
        globalMockSupabase._chain.then.mockImplementationOnce((onFulfilled: any) =>
            onFulfilled({ data: [{ id: listingId, slug: "test-biz" }], error: null })
        );

        const res = await POST(new Request("http://localhost/api/business/listings", {
            method: "POST",
            body: JSON.stringify({
                business_name: "Test Biz",
                category_id: "cat-1",
                address: "Addr",
                phone: "09123456789",
                short_description: "Short description here",
                barangay_id: "brgy-1"
            }),
        }) as any);

        expect(res.status).toBe(201);
    });

    it("updates listing and detects critical changes", async () => {
        const existing = {
            id: listingId,
            owner_id: userId,
            business_name: "Old Name",
            category_id: "cat-1",
            short_description: "Old",
            phone: "09123456789",
            barangay_id: "brgy-1",
            status: "approved"
        };

        globalMockSupabase._chain.single.mockResolvedValue({ data: existing, error: null });

        const res = await PUT(
            new Request(`http://localhost/api/business/listings/${listingId}`, {
                method: "PUT",
                body: JSON.stringify({
                    business_name: "New Name",
                    category_id: "cat-1",
                    address: "New Address",
                    phone: "09123456789",
                    short_description: "New",
                    barangay_id: "brgy-1"
                })
            }) as any,
            { params: Promise.resolve({ id: listingId }) } as any
        );

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.critical_changed).toBe(true);
    });

    it("soft-deletes the listing", async () => {
        globalMockSupabase._chain.maybeSingle.mockResolvedValue({ data: { id: listingId, owner_id: userId }, error: null });

        const res = await DELETE(new Request(`http://localhost/api/business/listings/${listingId}`, {
            method: "DELETE"
        }) as any, { params: Promise.resolve({ id: listingId }) } as any);

        expect(res.status).toBe(200);
    });
});
