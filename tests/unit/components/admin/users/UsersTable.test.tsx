import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsersTable from "@/components/admin/users/UsersTable";

const { toast } = vi.hoisted(() => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, className }: any) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
}));

vi.mock("react-hot-toast", () => ({
    toast,
}));

vi.mock("@/components/shared/LoadingSpinner", () => ({
    __esModule: true,
    default: () => <div>Loading...</div>,
}));

vi.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
    AvatarImage: ({ src }: any) => (src ? <img alt="avatar" src={src} /> : null),
    AvatarFallback: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuItem: ({ children, onClick, onSelect, asChild }: any) => {
        if (asChild) return children;

        return (
            <button
                type="button"
                onClick={(event) => {
                    onClick?.(event);
                    onSelect?.(event);
                }}
            >
                {children}
            </button>
        );
    },
}));

vi.mock("@/components/ui/select", async () => {
    const React = await import("react");
    const SelectContext = React.createContext<{ onValueChange?: (value: string) => void } | null>(null);

    return {
        Select: ({ children, onValueChange }: any) => (
            <SelectContext.Provider value={{ onValueChange }}>{children}</SelectContext.Provider>
        ),
        SelectTrigger: ({ children, className }: any) => <div className={className}>{children}</div>,
        SelectContent: ({ children }: any) => <div>{children}</div>,
        SelectItem: ({ children, value }: any) => {
            const ctx = React.useContext(SelectContext);

            return (
                <button
                    type="button"
                    data-testid={`select-item-${value}`}
                    onClick={() => ctx?.onValueChange?.(value)}
                >
                    {children}
                </button>
            );
        },
        SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    };
});

const makeJsonResponse = (data: any) =>
    Promise.resolve({
        json: async () => data,
    } as Response);

const usersPayload = {
    data: [
        {
            id: "user-1",
            full_name: "Ada Lovelace",
            email: "ada@example.com",
            phone: "09171234567",
            is_active: true,
            created_at: "2026-03-04T12:00:00.000Z",
            avatar_url: "https://img.test/ada.png",
            listing_count: 3,
            subscription_status: "active",
            subscription_plan: "premium",
        },
        {
            id: "user-2",
            full_name: "Bella Rivera",
            email: "bella@example.com",
            phone: null,
            is_active: false,
            created_at: "2026-03-05T12:00:00.000Z",
            avatar_url: null,
            listing_count: 1,
            subscription_status: null,
            subscription_plan: null,
        },
    ],
    pagination: {
        total: 12,
        page: 1,
        limit: 10,
        totalPages: 2,
    },
    stats: {
        total: 12,
        this_month: 4,
        with_subscriptions: 7,
        with_pending: 2,
    },
};

describe("UsersTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("renders fetched users, avatar fallback, counts, plans, and actions", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeJsonResponse(usersPayload));

        const { container } = render(<UsersTable />);

        expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
        expect(screen.getByText("ada@example.com")).toBeInTheDocument();
        expect(screen.getByText("09171234567")).toBeInTheDocument();
        expect(screen.getByText("premium")).toBeInTheDocument();
        expect(screen.getByText("Bella Rivera")).toBeInTheDocument();
        expect(screen.getByText("BR")).toBeInTheDocument();
        expect(screen.getAllByText("View Profile")).toHaveLength(2);
        expect(screen.getAllByText("Delete Account")).toHaveLength(2);
        expect(screen.getByText("Total Registered")).toBeInTheDocument();
        expect(container.querySelector('img[src="https://img.test/ada.png"]')).not.toBeNull();

        expect(fetch).toHaveBeenCalledWith("/api/admin/users?page=1&limit=10&search=&status=");
    });

    it("submits search text and applies the status filter through the next fetch", async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(makeJsonResponse(usersPayload))
            .mockResolvedValueOnce(makeJsonResponse(usersPayload))
            .mockResolvedValueOnce(makeJsonResponse(usersPayload));

        render(<UsersTable />);

        const searchInput = await screen.findByPlaceholderText("Search name, email, phone...");
        fireEvent.change(searchInput, { target: { value: "bella@example.com" } });
        fireEvent.submit(searchInput.closest("form")!);

        await waitFor(() => {
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                "/api/admin/users?page=1&limit=10&search=bella%40example.com&status="
            );
        });

        fireEvent.click(screen.getByTestId("select-item-active"));

        await waitFor(() => {
            expect(fetch).toHaveBeenLastCalledWith(
                "/api/admin/users?page=1&limit=10&search=bella%40example.com&status=active"
            );
        });
    });

    it("toggles a user account from the actions menu and updates the visible status", async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(makeJsonResponse(usersPayload))
            .mockResolvedValueOnce(makeJsonResponse({ success: true }));

        render(<UsersTable />);

        expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Deactivate Account"));

        await waitFor(() => {
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                "/api/admin/users/user-1",
                expect.objectContaining({
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "toggle_active", is_active: false }),
                })
            );
        });

        expect((await screen.findAllByText("Inactive")).length).toBeGreaterThanOrEqual(2);
        expect(toast.success).toHaveBeenCalledWith("User deactivated successfully");
    });
});
