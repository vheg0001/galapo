import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoist mock Supabase client so vi.mock factories can access it ────────────
const { mockSupabase, getQc } = vi.hoisted(() => {
    let _qc: any = null;

    const buildChain = () => {
        const chain: any = {};
        ["select", "from", "insert", "update", "delete", "eq", "neq", "in", "gte", "lte", "order", "range", "limit", "or"].forEach(m => {
            chain[m] = vi.fn().mockReturnThis();
        });
        chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        chain.then = vi.fn(function (resolve: any) {
            return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
        });
        return chain;
    };

    _qc = buildChain();

    const client: any = {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "admin-123" } } }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-123" } }, error: null }),
        },
        from: vi.fn(() => _qc),
        _getChain: () => _qc,
        _resetChain: () => {
            _qc = buildChain();
            client.from = vi.fn(() => _qc);
        }
    };

    return { mockSupabase: client, getQc: () => _qc };
});

// ─── Mock lib/supabase ────────────────────────────────────────────────────────
vi.mock("@/lib/supabase", () => ({
    createBrowserSupabaseClient: vi.fn(() => mockSupabase),
    createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
    createAdminSupabaseClient: vi.fn(() => mockSupabase),
}));

// ─── Mock lib/auth-helpers ────────────────────────────────────────────────────
vi.mock("@/lib/auth-helpers", () => ({
    getServerSession: vi.fn().mockResolvedValue({ user: { id: "admin-123" } }),
}));

// ─── Mock lib/admin-helpers (requireAdmin only) ───────────────────────────────
// By mocking requireAdmin we prevent it from ever querying the DB,
// so route-handler specific single()/maybeSingle() calls are never stolen.
vi.mock("@/lib/admin-helpers", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/admin-helpers")>();
    return {
        ...actual,
        requireAdmin: vi.fn().mockResolvedValue({
            session: { user: { id: "admin-123" } },
            adminClient: mockSupabase,
        }),
    };
});

// ─── Route Handler Imports ────────────────────────────────────────────────────
import { GET as getStats } from "@/app/api/admin/dashboard/stats/route";
import { GET as getUsers } from "@/app/api/admin/users/route";
import { PUT as updateUser } from "@/app/api/admin/users/[id]/route";
import { PUT as updateClaim } from "@/app/api/admin/claims/[id]/route";
import { POST as triggerCheck } from "@/app/api/admin/annual-checks/trigger/route";
import { PUT as updateCheck } from "@/app/api/admin/annual-checks/[id]/route";

import { getServerSession } from "@/lib/auth-helpers";
import { requireAdmin } from "@/lib/admin-helpers";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Admin Dashboard API Integration", () => {
    beforeEach(() => {
        // Fresh query chain per test (no mock bleed)
        mockSupabase._resetChain();

        vi.mocked(getServerSession).mockResolvedValue({ user: { id: "admin-123" } } as any);
        vi.mocked(requireAdmin).mockResolvedValue({
            session: { user: { id: "admin-123" } },
            adminClient: mockSupabase,
        } as any);
    });

    // ─── Security ─────────────────────────────────────────────────────────────

    it("returns 401 if unauthenticated", async () => {
        vi.mocked(requireAdmin).mockResolvedValueOnce({
            error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
        } as any);
        const res = await getStats(new NextRequest("http://localhost/api/admin/stats"));
        expect(res!.status).toBe(401);
    });

    it("returns 403 if not a super_admin", async () => {
        vi.mocked(requireAdmin).mockResolvedValueOnce({
            error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
        } as any);
        const res = await getStats(new NextRequest("http://localhost/api/admin/stats"));
        expect(res!.status).toBe(403);
    });

    // ─── Dashboard Stats ──────────────────────────────────────────────────────

    it("GET /api/admin/dashboard/stats returns combined stats", async () => {
        const qc = getQc();
        qc.then.mockImplementation((resolve: any) =>
            Promise.resolve({ data: [], count: 10, error: null }).then(resolve)
        );

        const res = await getStats(new NextRequest("http://localhost/api/admin/stats"));
        expect(res!.status).toBe(200);
        const data = await res!.json();
        expect(data).toHaveProperty("total_active_listings");
        expect(data).toHaveProperty("revenue_this_month");
    });

    // ─── User Management ──────────────────────────────────────────────────────

    it("GET /api/admin/users returns paginated list", async () => {
        const qc = getQc();
        qc.then.mockImplementation((resolve: any) =>
            Promise.resolve({ data: [{ id: "u1", full_name: "User One" }], count: 1, error: null }).then(resolve)
        );

        const res = await getUsers(new NextRequest("http://localhost/api/admin/users?page=1"));
        expect(res!.status).toBe(200);
        const data = await res!.json();
        expect(data.users).toHaveLength(1);
    });

    it("PUT /api/admin/users/[id] updates status", async () => {
        const qc = getQc();
        qc.single.mockResolvedValueOnce({ data: { id: "u1", is_active: false }, error: null });

        const req = new NextRequest("http://localhost/api/admin/users/u1", {
            method: "PUT",
            body: JSON.stringify({ is_active: false }),
        });
        const res = await updateUser(req, { params: Promise.resolve({ id: "u1" }) });
        expect(res!.status).toBe(200);
        const data = await res!.json();
        expect(data.profile.is_active).toBe(false);
    });

    // ─── Claim Management ─────────────────────────────────────────────────────

    it("PUT /api/admin/claims/[id] approve workflow", async () => {
        const qc = getQc();
        qc.single.mockResolvedValueOnce({
            data: { id: "l1", business_name: "Shop", owner_id: "u1", status: "claimed_pending" },
            error: null,
        });

        const req = new NextRequest("http://localhost/api/admin/claims/l1", {
            method: "PUT",
            body: JSON.stringify({ action: "approve" }),
        });
        const res = await updateClaim(req, { params: Promise.resolve({ id: "l1" }) });
        expect(res!.status).toBe(200);
        const data = await res!.json();
        expect(data.action).toBe("approved");
    });

    // ─── Annual Checks ────────────────────────────────────────────────────────

    it("POST /api/admin/annual-checks/trigger creates check", async () => {
        const qc = getQc();
        qc.single.mockResolvedValueOnce({
            data: { id: "l1", business_name: "Shop", owner_id: "u1", is_active: true },
            error: null,
        });
        qc.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        qc.single.mockResolvedValueOnce({ data: { id: "c1" }, error: null });

        const req = new NextRequest("http://localhost/api/admin/annual-checks/trigger", {
            method: "POST",
            body: JSON.stringify({ listing_id: "l1" }),
        });
        const res = await triggerCheck(req);
        expect(res!.status).toBe(200);
        const data = await res!.json();
        expect(data.success).toBe(true);
    });

    it("PUT /api/admin/annual-checks/[id] deactivate workflow", async () => {
        const qc = getQc();
        qc.single.mockResolvedValueOnce({
            data: { id: "c1", listing_id: "l1", listings: { id: "l1", owner_id: "u1" } },
            error: null,
        });

        const req = new NextRequest("http://localhost/api/admin/annual-checks/c1", {
            method: "PUT",
            body: JSON.stringify({ action: "deactivate" }),
        });
        const res = await updateCheck(req, { params: Promise.resolve({ id: "c1" }) });
        expect(res!.status).toBe(200);
        const data = await res!.json();
        expect(data.action).toBe("deactivated");
    });
});
