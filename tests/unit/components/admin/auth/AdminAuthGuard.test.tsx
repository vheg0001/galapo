import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminAuthGuard from "@/components/admin/auth/AdminAuthGuard";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));

// Mock supabase
vi.mock("@/lib/supabase", () => ({
    createBrowserSupabaseClient: vi.fn(),
}));

describe("AdminAuthGuard", () => {
    const mockRouterReplace = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({ replace: mockRouterReplace });
    });

    it("shows loading spinner initially", () => {
        (createBrowserSupabaseClient as any).mockReturnValue({
            auth: { getSession: vi.fn(() => new Promise(() => { })) }, // Never resolves
        });

        render(<AdminAuthGuard><div>Children</div></AdminAuthGuard>);
        expect(screen.getByText(/Verifying access.../i)).toBeInTheDocument();
    });

    it("redirects to login if no session", async () => {
        (createBrowserSupabaseClient as any).mockReturnValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
        });

        render(<AdminAuthGuard><div>Children</div></AdminAuthGuard>);

        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login");
        });
    });

    it("redirects to login error if not an admin", async () => {
        (createBrowserSupabaseClient as any).mockReturnValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { role: "business_owner", is_active: true }, error: null }),
            }),
        });

        render(<AdminAuthGuard><div>Children</div></AdminAuthGuard>);

        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login?error=unauthorized");
        });
    });

    it("renders children if user is an active super_admin", async () => {
        (createBrowserSupabaseClient as any).mockReturnValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { role: "super_admin", is_active: true }, error: null }),
            }),
        });

        render(<AdminAuthGuard><div>Protected Content</div></AdminAuthGuard>);

        await waitFor(() => {
            expect(screen.getByText("Protected Content")).toBeInTheDocument();
        });
        expect(mockRouterReplace).not.toHaveBeenCalled();
    });

    it("redirects if account is inactive", async () => {
        (createBrowserSupabaseClient as any).mockReturnValue({
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null }) },
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { role: "super_admin", is_active: false }, error: null }),
            }),
        });

        render(<AdminAuthGuard><div>Children</div></AdminAuthGuard>);

        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login?error=unauthorized");
        });
    });
});
