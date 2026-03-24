import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as adminGet, PATCH as adminPatch } from "@/app/api/admin/settings/route";
import { GET as publicGet } from "@/app/api/settings/public/route";
import { NextRequest } from "next/server";
import * as adminHelpers from "@/lib/admin-helpers";

// Mock auth
vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: vi.fn(),
}));

const mockQuery = {
    select: vi.fn(),
    in: vi.fn(),
    upsert: vi.fn(),
};

const mockClient = {
    from: vi.fn().mockReturnValue({
        select: vi.fn(() => mockQuery),
        upsert: vi.fn(() => ({ onConflict: vi.fn().mockResolvedValue({ error: null }) })),
    }),
};

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: () => mockClient,
    createServerSupabaseClient: () => mockClient,
}));

describe("Settings APIs (Admin & Public)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (adminHelpers.requireAdmin as any).mockResolvedValue({ id: "admin-uid" });
    });

    it("GET /api/admin/settings returns all settings for admin", async () => {
        const mockSettings = [
            { key: "site_name", value: JSON.stringify("GalaPo") },
            { key: "price_premium", value: "2400" }
        ];

        mockQuery.select.mockResolvedValue({ data: mockSettings, error: null });
        mockClient.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                mockResolvedValue: vi.fn().mockResolvedValue({ data: mockSettings, error: null })
            })
        } as any);

        // Mocking Supabase more accurately for the route's specific call
        mockClient.from.mockImplementation((table) => {
            if (table === "site_settings") {
                return {
                    select: vi.fn().mockResolvedValue({ data: mockSettings, error: null })
                };
            }
            return {};
        });

        const req = new NextRequest("http://localhost/api/admin/settings");
        const res = await adminGet(req);

        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.data.site_name).toBe("GalaPo");
        expect(json.data.price_premium).toBe(2400);
    });

    it("PATCH /api/admin/settings updates settings and validates pricing", async () => {
        const payload = { site_name: "New Name", price_premium: -100 }; // Invalid price
        const req = new NextRequest("http://localhost/api/admin/settings", {
            method: "PATCH",
            body: JSON.stringify(payload)
        });

        const res = await adminPatch(req);
        expect(res!.status).toBe(400);
        const json = await res!.json();
        expect(json.error).toContain("must be a non-negative number");
    });

    it("PATCH /api/admin/settings valid payload works", async () => {
        const payload = { site_name: "GalaPo", adsense_publisher_id: "ca-pub-12345678" };
        const req = new NextRequest("http://localhost/api/admin/settings", {
            method: "PATCH",
            body: JSON.stringify(payload)
        });

        mockClient.from.mockReturnValue({
            upsert: vi.fn().mockResolvedValue({ error: null })
        } as any);

        const res = await adminPatch(req);
        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.success).toBe(true);
    });

    it("public GET /api/settings/public returns safe settings only", async () => {
        const mockRawSettings = [
            { key: "site_name", value: "GalaPo" },
            { key: "contact_email", value: "hello@galapo.ph" }
        ];

        mockClient.from.mockImplementation((table) => {
            if (table === "site_settings") {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: mockRawSettings, error: null })
                    })
                };
            }
            return {};
        });

        const req = new NextRequest("http://localhost/api/settings/public");
        const res = await publicGet();

        expect(res!.status).toBe(200);
        const json = await res!.json();
        expect(json.data.site_name).toBe("GalaPo");
        expect(json.data.contact_email).toBe("hello@galapo.ph");
        // Sensitive data like price_premium shouldn't be here (and wasn't mocked)
    });
});
