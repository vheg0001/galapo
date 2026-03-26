import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockSupabase, mockRequireAdmin, mockState, resetMockState } = vi.hoisted(() => {
    const state = {
        thenQueue: [] as any[],
        singleQueue: [] as any[],
        calls: {
            from: [] as string[],
            eq: [] as any[],
            insert: [] as any[],
            update: [] as any[],
        },
    };

    const chain: any = {};

    ["select", "eq"].forEach((name) => {
        chain[name] = vi.fn((...args: any[]) => {
            (state.calls as any)[name]?.push(args);
            return chain;
        });
    });

    chain.insert = vi.fn((payload: any) => {
        state.calls.insert.push(payload);
        return chain;
    });

    chain.update = vi.fn((payload: any) => {
        state.calls.update.push(payload);
        return chain;
    });

    chain.single = vi.fn(() => Promise.resolve(state.singleQueue.shift() ?? { data: null, error: null }));
    chain.then = vi.fn((resolve: any, reject: any) =>
        Promise.resolve(state.thenQueue.shift() ?? { data: null, error: null }).then(resolve, reject)
    );

    const client: any = {
        from: vi.fn((table: string) => {
            state.calls.from.push(table);
            return chain;
        }),
    };

    const requireAdmin = vi.fn().mockResolvedValue({
        user: { id: "admin-1" },
        profile: { id: "admin-1", role: "super_admin" },
    });

    const reset = () => {
        state.thenQueue = [];
        state.singleQueue = [];
        state.calls = {
            from: [],
            eq: [],
            insert: [],
            update: [],
        };

        Object.values(chain).forEach((fn: any) => fn?.mockClear?.());
        client.from.mockClear();
        requireAdmin.mockReset();
        requireAdmin.mockResolvedValue({
            user: { id: "admin-1" },
            profile: { id: "admin-1", role: "super_admin" },
        });
    };

    return {
        mockSupabase: client,
        mockRequireAdmin: requireAdmin,
        mockState: state,
        resetMockState: reset,
    };
});

vi.mock("@/lib/auth-helpers", () => ({
    requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(() => mockSupabase),
}));

import { PUT as updateAnnualCheck } from "@/app/api/admin/annual-checks/[id]/route";

describe("Annual check deactivation flow", () => {
    beforeEach(() => {
        resetMockState();
    });

    it("deactivates the listing, creates a reactivation fee, cancels subscriptions, and notifies the owner", async () => {
        mockState.singleQueue.push({
            data: {
                id: "check-1",
                listing_id: "listing-1",
                response_deadline: "2026-03-26",
                listings: {
                    id: "listing-1",
                    business_name: "Cafe Uno",
                    owner_id: "owner-1",
                    is_active: true,
                },
            },
            error: null,
        });

        mockState.thenQueue.push(
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null }
        );

        const response = await updateAnnualCheck(
            new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                method: "PUT",
                body: JSON.stringify({ action: "deactivate" }),
            }),
            { params: Promise.resolve({ id: "check-1" }) }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({ success: true, action: "deactivated" });
        expect(mockState.calls.update).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: "deactivated" }),
                expect.objectContaining({ is_active: false }),
                expect.objectContaining({ status: "cancelled" }),
            ])
        );
        expect(mockState.calls.insert).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    listing_id: "listing-1",
                    annual_check_id: "check-1",
                    status: "pending",
                }),
                expect.objectContaining({
                    user_id: "owner-1",
                    type: "listing_deactivated",
                    title: "Listing Deactivated",
                }),
            ])
        );
    });

    it("rejects unsupported actions before mutating anything", async () => {
        const response = await updateAnnualCheck(
            new NextRequest("http://localhost/api/admin/annual-checks/check-1", {
                method: "PUT",
                body: JSON.stringify({ action: "archive" }),
            }),
            { params: Promise.resolve({ id: "check-1" }) }
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({
            error: "Invalid action. Use 'confirm', 'deactivate', 'extend', or 'send_reminder'.",
        });
        expect(mockState.calls.update).toHaveLength(0);
        expect(mockState.calls.insert).toHaveLength(0);
    });
});
