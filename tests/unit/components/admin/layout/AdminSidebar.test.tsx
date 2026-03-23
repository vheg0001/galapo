import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import { useRouter, usePathname } from "next/navigation";

// Mock lucide icons to avoid snapshot noise and focus on presence
vi.mock("lucide-react", async () => {
    const actual = await vi.importActual("lucide-react");
    return {
        ...actual,
        LayoutDashboard: () => <div data-testid="icon-dashboard" />,
        LogOut: () => <div data-testid="icon-logout" />,
        ChevronRight: () => <div data-testid="icon-chevron-right" />,
        ChevronLeft: () => <div data-testid="icon-chevron-left" />,
        ExternalLink: () => <div data-testid="icon-external" />,
    };
});

// Mock Supabase with a simpler implementation for this test
vi.mock("@/lib/supabase", () => ({
    createBrowserSupabaseClient: vi.fn(() => ({
        auth: {
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
    })),
}));

describe("AdminSidebar", () => {
    const mockOnToggle = vi.fn();
    const mockRouterPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue({ push: mockRouterPush });
        (usePathname as any).mockReturnValue("/admin/dashboard");
    });

    it("renders all navigation groups and items when expanded", () => {
        render(
            <AdminSidebar
                collapsed={false}
                onToggle={mockOnToggle}
                adminName="John Admin"
            />
        );

        // Check groups
        expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        expect(screen.getByText(/Content Management/i)).toBeInTheDocument();
        expect(screen.getByText(/Monetization/i)).toBeInTheDocument();
        expect(screen.getByText(/Users/i)).toBeInTheDocument();
        expect(screen.getByText(/System/i)).toBeInTheDocument();

        // Check specific items
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Listings")).toBeInTheDocument();
        expect(screen.getByText("Payments")).toBeInTheDocument();
        expect(screen.getByText("Business Owners")).toBeInTheDocument();
        expect(screen.getByText("Claim Requests")).toBeInTheDocument();

        // Check admin info
        expect(screen.getByText("John Admin")).toBeInTheDocument();
    });

    it("shows correct pending count badges", () => {
        render(
            <AdminSidebar
                collapsed={false}
                onToggle={mockOnToggle}
                pendingListings={12}
                pendingPayments={5}
                pendingClaims={999}
            />
        );

        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("99+")).toBeInTheDocument(); // Badge maxes at 99+
    });

    it("highlights the active route", () => {
        (usePathname as any).mockReturnValue("/admin/dashboard");
        render(<AdminSidebar collapsed={false} onToggle={mockOnToggle} />);

        const dashboardLink = screen.getByText("Dashboard").closest("a");
        expect(dashboardLink).toHaveClass("border-[#FF6B35]");
        expect(dashboardLink).toHaveClass("text-white");
    });

    it("collapses to icons-only on toggle", () => {
        const { rerender } = render(
            <AdminSidebar collapsed={false} onToggle={mockOnToggle} />
        );

        // Header text exists when expanded
        expect(screen.getByText("GalaPo")).toBeInTheDocument();

        // Toggle button click
        const toggleBtn = screen.getByTestId("icon-chevron-left").parentElement!;
        fireEvent.click(toggleBtn);
        expect(mockOnToggle).toHaveBeenCalled();

        // Rerender as collapsed
        rerender(<AdminSidebar collapsed={true} onToggle={mockOnToggle} />);

        // Header text hidden when collapsed
        expect(screen.queryByText("GalaPo")).not.toBeInTheDocument();
        // Icons still exist
        expect(screen.getByTestId("icon-dashboard")).toBeInTheDocument();
    });

    it("logout button calls supabase signOut and redirects", async () => {
        render(<AdminSidebar collapsed={false} onToggle={mockOnToggle} />);

        const logoutBtn = screen.getByText(/Logout/i);
        fireEvent.click(logoutBtn);

        expect(screen.getByText(/Logging out.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith("/admin/login");
        });
    });

    it("View Public Site opens in new tab", () => {
        render(<AdminSidebar collapsed={false} onToggle={mockOnToggle} />);

        const publicLink = screen.getByText(/View Public Site/i).closest("a");
        expect(publicLink).toHaveAttribute("target", "_blank");
        expect(publicLink).toHaveAttribute("href", "/");
    });
});
