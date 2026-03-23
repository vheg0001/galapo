import { render, screen } from "@testing-library/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));

describe("AuthGuard", () => {
    const mockReplace = vi.fn();
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({
            replace: mockReplace,
            push: mockPush,
        });
    });

    it("renders children when user is authenticated", () => {
        (useAuthStore as any).mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            profile: { role: "business_owner" }
        });

        render(
            <AuthGuard>
                <div data-testid="protected-content">Protected Content</div>
            </AuthGuard>
        );

        expect(screen.getByTestId("protected-content")).toBeDefined();
    });

    it("redirects to login when user is not authenticated", () => {
        (useAuthStore as any).mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
        });

        render(
            <AuthGuard>
                <div>Protected Content</div>
            </AuthGuard>
        );

        expect(mockReplace).toHaveBeenCalledWith("/login");
    });

    it("shows loading spinner when auth is loading", () => {
        (useAuthStore as any).mockReturnValue({
            isLoading: true,
            isAuthenticated: false,
        });

        render(
            <AuthGuard>
                <div>Protected Content</div>
            </AuthGuard>
        );

        expect(screen.getByTestId("loading-spinner")).toBeDefined();
    });

    it("redirects to login when user has wrong role", () => {
        (useAuthStore as any).mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            profile: { role: "user" } // Not a business_owner
        });

        render(
            <AuthGuard>
                <div>Protected Content</div>
            </AuthGuard>
        );

        expect(mockReplace).toHaveBeenCalledWith("/login?error=unauthorized");
    });
});
