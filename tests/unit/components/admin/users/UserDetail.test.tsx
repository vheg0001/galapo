import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfileCard from "@/components/admin/users/UserProfileCard";
import UserListingsSection from "@/components/admin/users/UserListingsSection";
import UserPaymentsSection from "@/components/admin/users/UserPaymentsSection";
import UserActivityLog from "@/components/admin/users/UserActivityLog";
import AdminUserNotes from "@/components/admin/users/AdminUserNotes";
import SendEmailModal from "@/components/admin/users/SendEmailModal";
import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";

const { toast, pushMock } = vi.hoisted(() => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
    pushMock: vi.fn(),
}));

vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, className }: any) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}));

vi.mock("react-hot-toast", () => ({
    toast,
}));

vi.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
    AvatarImage: ({ src }: any) => (src ? <img alt="avatar" src={src} /> : null),
    AvatarFallback: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock("@/components/ui/dialog", async () => {
    const React = await import("react");

    return {
        Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
        DialogContent: ({ children }: any) => <div>{children}</div>,
        DialogHeader: ({ children }: any) => <div>{children}</div>,
        DialogTitle: ({ children }: any) => <h2>{children}</h2>,
        DialogDescription: ({ children }: any) => <p>{children}</p>,
        DialogFooter: ({ children }: any) => <div>{children}</div>,
        DialogTrigger: ({ children }: any) => <>{children}</>,
    };
});

vi.mock("@/components/ui/select", async () => {
    const React = await import("react");
    const SelectContext = React.createContext<{ onValueChange?: (value: string) => void } | null>(null);

    return {
        Select: ({ children, onValueChange }: any) => (
            <SelectContext.Provider value={{ onValueChange }}>{children}</SelectContext.Provider>
        ),
        SelectTrigger: ({ children }: any) => <div>{children}</div>,
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

vi.mock("@/components/ui/radio-group", async () => {
    const React = await import("react");
    const RadioGroupContext = React.createContext<{ onValueChange?: (value: string) => void } | null>(null);

    return {
        RadioGroup: ({ children, onValueChange }: any) => (
            <RadioGroupContext.Provider value={{ onValueChange }}>{children}</RadioGroupContext.Provider>
        ),
        RadioGroupItem: ({ value, id, disabled }: any) => {
            const ctx = React.useContext(RadioGroupContext);

            return (
                <button
                    id={id}
                    type="button"
                    disabled={disabled}
                    data-testid={`radio-item-${value}`}
                    onClick={() => ctx?.onValueChange?.(value)}
                >
                    {value}
                </button>
            );
        },
    };
});

const makeJsonResponse = (data: any) =>
    Promise.resolve({
        json: async () => data,
    } as Response);

const profile = {
    id: "user-1",
    full_name: "Jamie Santos",
    email: "jamie@example.com",
    phone: "09170000000",
    is_active: true,
    created_at: "2026-03-10T12:00:00.000Z",
    avatar_url: null,
    role: "business_owner",
};

describe("Admin user detail components", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("renders the user profile section and toggles active status", async () => {
        const onUpdate = vi.fn();
        vi.mocked(fetch).mockResolvedValueOnce(makeJsonResponse({ success: true }));

        render(<UserProfileCard profile={profile} onUpdate={onUpdate} />);

        expect(screen.getByText("Jamie Santos")).toBeInTheDocument();
        expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
        expect(screen.getByText("09170000000")).toBeInTheDocument();
        expect(screen.getByText("Business Owner")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Deactivate Account/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/admin/users/user-1",
                expect.objectContaining({
                    method: "PUT",
                    body: JSON.stringify({ is_active: false }),
                })
            );
        });

        expect(onUpdate).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith("User deactivated successfully");
    });

    it("renders the listings section with listing metadata and admin actions", () => {
        render(
            <UserListingsSection
                ownerId="user-1"
                ownerName="Jamie Santos"
                listings={[
                    {
                        id: "listing-1",
                        business_name: "Cafe Uno",
                        slug: "cafe-uno",
                        status: "approved",
                        created_at: "2026-03-11T12:00:00.000Z",
                        is_active: true,
                        is_premium: true,
                        is_featured: false,
                    },
                ]}
            />
        );

        expect(screen.getByText("Listings by Jamie Santos")).toBeInTheDocument();
        expect(screen.getByText("Cafe Uno")).toBeInTheDocument();
        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.getByText("Premium")).toBeInTheDocument();
        expect(screen.getByText("Live")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Manage/i })).toHaveAttribute("href", "/admin/listings/listing-1");
    });

    it("renders subscription and payment history tables", () => {
        const { rerender } = render(
            <UserPaymentsSection
                type="subscriptions"
                data={[
                    {
                        id: "sub-1",
                        plan_type: "premium",
                        amount: 1500,
                        status: "active",
                        start_date: "2026-03-01T12:00:00.000Z",
                        end_date: "2026-03-31T12:00:00.000Z",
                        created_at: "2026-03-01T12:00:00.000Z",
                        listings: { business_name: "Cafe Uno" },
                    },
                ]}
            />
        );

        expect(screen.getByText("PREMIUM - Cafe Uno")).toBeInTheDocument();
        expect(screen.getByText(/1,500/)).toBeInTheDocument();
        expect(screen.getByText("Active")).toBeInTheDocument();

        rerender(
            <UserPaymentsSection
                type="payments"
                data={[
                    {
                        id: "pay-1",
                        amount: 800,
                        status: "approved",
                        payment_method: "gcash",
                        created_at: "2026-03-02T12:00:00.000Z",
                        reference_number: "REF-100",
                        listings: { business_name: "Cafe Uno" },
                    },
                ]}
            />
        );

        expect(screen.getByText("Payment for Cafe Uno")).toBeInTheDocument();
        expect(screen.getByText("gcash")).toBeInTheDocument();
        expect(screen.getByText("REF: REF-100")).toBeInTheDocument();
    });

    it("renders activity entries in the provided order", () => {
        const { container } = render(
            <UserActivityLog
                activity={[
                    {
                        id: "log-1",
                        listing_id: "listing-a-12345678",
                        created_at: "2026-03-12T13:00:00.000Z",
                    },
                    {
                        id: "log-2",
                        listing_id: "listing-b-87654321",
                        created_at: "2026-03-10T13:00:00.000Z",
                    },
                ]}
            />
        );

        const text = container.textContent || "";
        expect(text.indexOf("listing-")).toBeGreaterThan(-1);
        expect(text.indexOf("listing-")).toBeLessThan(text.lastIndexOf("listing-"));
        expect(text.indexOf("listing-")).toBeLessThan(text.indexOf("View Full History Report"));
    });

    it("shows note history and allows admins to add a note", async () => {
        render(<AdminUserNotes userId="user-1" />);

        expect(
            await screen.findByText("Business owner requested information about premium upgrades.")
        ).toBeInTheDocument();

        vi.useFakeTimers();
        fireEvent.change(screen.getByPlaceholderText("Add a new note about this user..."), {
            target: { value: "Followed up by phone and confirmed the profile details." },
        });
        fireEvent.click(screen.getByRole("button", { name: /Save Internal Note/i }));

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });

        expect(screen.getByText("Followed up by phone and confirmed the profile details.")).toBeInTheDocument();
        expect(toast.success).toHaveBeenCalledWith("Note saved successfully");

        vi.useRealTimers();
    });

    it("applies an email template and sends the composed message", async () => {
        vi.useFakeTimers();
        const onClose = vi.fn();

        render(
            <SendEmailModal
                isOpen
                onClose={onClose}
                user={{ id: "user-1", full_name: "Jamie Santos", email: "jamie@example.com" }}
            />
        );

        fireEvent.click(screen.getByTestId("select-item-verification"));

        expect(screen.getByDisplayValue("Action Required: Annual Verification for your Listing")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Send Message/i }));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1500);
        });

        expect(toast.success).toHaveBeenCalledWith("Email sent successfully to jamie@example.com");
        expect(onClose).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    it("submits account deletion with the selected listing strategy", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeJsonResponse({ success: true }));

        render(
            <DeleteUserDialog
                isOpen
                onClose={vi.fn()}
                user={{ id: "user-1", full_name: "Jamie Santos", email: "jamie@example.com" }}
            />
        );

        fireEvent.click(screen.getByTestId("radio-item-delete_all"));
        fireEvent.click(screen.getByRole("button", { name: /Permanently Delete/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith("/api/admin/users/user-1?strategy=delete_all", {
                method: "DELETE",
            });
        });

        expect(pushMock).toHaveBeenCalledWith("/admin/users");
        expect(toast.success).toHaveBeenCalledWith("Account deleted successfully");
    });
});
