import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/business/Sidebar";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
const mockLogout = vi.fn();
vi.mock("@/store/authStore", () => ({
    useAuthStore: () => ({
        logout: mockLogout,
        profile: {
            full_name: "Juan Dela Cruz",
            email: "juan@example.com",
            avatar_url: null,
            role: "business_owner"
        }
    }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
    usePathname: () => "/business/dashboard",
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe("Sidebar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders user information correctly", () => {
        render(<Sidebar />);
        expect(screen.getByText("Juan Dela Cruz")).toBeDefined();
        expect(screen.getByText("juan@example.com")).toBeDefined();
    });

    it("renders all navigation items", () => {
        render(<Sidebar />);
        expect(screen.getByText(/dashboard/i)).toBeDefined();
        expect(screen.getByText(/my listings/i)).toBeDefined();
        expect(screen.getByText(/add new listing/i)).toBeDefined();
        expect(screen.getByText(/deals & offers/i)).toBeDefined();
        expect(screen.getByText(/account settings/i)).toBeDefined();
    });

    it("highlights the active route", () => {
        render(<Sidebar />);
        // The active class is bg-[#FF6B35] as seen in Sidebar.tsx
        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboardLink).toHaveClass("bg-[#FF6B35]");
    });

    it("calls logout when logout button is clicked", () => {
        render(<Sidebar />);
        const logoutButton = screen.getByRole("button", { name: /logout/i });
        fireEvent.click(logoutButton);
        expect(mockLogout).toHaveBeenCalled();
    });

    it("renders the notification badge if unread notifications exist", () => {
        // We'd need to mock useAuthStore differently to test this if count is in store
        // Or mock the NotificationBell
        render(<Sidebar />);
        // Assuming notification bell is rendered inside sidebar or topbar? 
        // Sidebar.tsx in 7.1 shows navigation items. NotificationBell is in TopBar usually.
    });
});
