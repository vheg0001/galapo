import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminNotificationsList from "@/components/admin/notifications/AdminNotificationsList";
import SendNotificationModal from "@/components/admin/notifications/SendNotificationModal";

const { toast } = vi.hoisted(() => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("react-hot-toast", () => ({
    toast,
}));

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

vi.mock("@/components/ui/dialog", async () => {
    const React = await import("react");
    const DialogContext = React.createContext<{
        open: boolean;
        setOpen: (value: boolean) => void;
    } | null>(null);

    const Dialog = ({ open, onOpenChange, children }: any) => {
        const [internalOpen, setInternalOpen] = React.useState(false);
        const resolvedOpen = open ?? internalOpen;
        const setOpen = (value: boolean) => {
            onOpenChange?.(value);
            if (open === undefined) setInternalOpen(value);
        };

        return (
            <DialogContext.Provider value={{ open: resolvedOpen, setOpen }}>
                {children}
            </DialogContext.Provider>
        );
    };

    const DialogContent = ({ children }: any) => {
        const ctx = React.useContext(DialogContext);
        return ctx?.open ? <div>{children}</div> : null;
    };

    return {
        Dialog,
        DialogContent,
        DialogHeader: ({ children }: any) => <div>{children}</div>,
        DialogTitle: ({ children }: any) => <h2>{children}</h2>,
        DialogDescription: ({ children }: any) => <p>{children}</p>,
        DialogFooter: ({ children }: any) => <div>{children}</div>,
    };
});

vi.mock("@/components/ui/checkbox", () => ({
    Checkbox: ({ checked, onCheckedChange, id }: any) => (
        <input
            id={id}
            type="checkbox"
            checked={!!checked}
            onChange={(event) => onCheckedChange?.(event.target.checked)}
        />
    ),
}));

const makeJsonResponse = (data: any) =>
    Promise.resolve({
        json: async () => data,
    } as Response);

const notificationsPayload = {
    notifications: [
        {
            id: "notif-1",
            title: "System Maintenance",
            message: "The admin dashboard will be offline tonight.",
            type: "system",
            is_read: false,
            created_at: "2026-03-26T12:00:00.000Z",
            user: {
                full_name: "Jamie Santos",
                email: "jamie@example.com",
            },
        },
        {
            id: "notif-2",
            title: "Citywide Broadcast",
            message: "Important update for all business owners.",
            type: "broadcast",
            is_read: true,
            created_at: "2026-03-25T12:00:00.000Z",
            user: null,
        },
    ],
    unread_count: 1,
    pagination: {
        total: 2,
        page: 1,
        limit: 50,
    },
};

describe("AdminNotificationsList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("renders notification rows, badges, unread state, and broadcast recipients", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeJsonResponse(notificationsPayload));

        render(<AdminNotificationsList />);

        expect(await screen.findByText("System Maintenance")).toBeInTheDocument();
        expect(screen.getByText("The admin dashboard will be offline tonight.")).toBeInTheDocument();
        expect(screen.getByText("Jamie Santos")).toBeInTheDocument();
        expect(screen.getAllByText("System").length).toBeGreaterThan(0);
        expect(screen.getByText("Unread")).toBeInTheDocument();
        expect(screen.getAllByText("Broadcast").length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /Mark All Read/i })).toBeInTheDocument();
    });

    it("marks all notifications as read and refreshes the list", async () => {
        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        vi.mocked(fetch)
            .mockResolvedValueOnce(makeJsonResponse(notificationsPayload))
            .mockResolvedValueOnce(makeJsonResponse({ success: true }))
            .mockResolvedValueOnce(
                makeJsonResponse({
                    ...notificationsPayload,
                    unread_count: 0,
                })
            );

        render(<AdminNotificationsList />);

        expect(await screen.findByText("System Maintenance")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Mark All Read/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenNthCalledWith(2, "/api/notifications/read-all", {
                method: "PATCH",
            });
        });

        expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
        expect(toast.success).toHaveBeenCalledWith("All notifications marked as read");
    });

    it("applies the type filter when the admin changes the dropdown", async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(makeJsonResponse(notificationsPayload))
            .mockResolvedValueOnce(makeJsonResponse(notificationsPayload));

        render(<AdminNotificationsList />);

        expect(await screen.findByText("System Maintenance")).toBeInTheDocument();
        fireEvent.click(screen.getByTestId("select-item-annual_check"));

        await waitFor(() => {
            expect(fetch).toHaveBeenLastCalledWith("/api/admin/notifications?type=annual_check&page=1");
        });
    });
});

describe("SendNotificationModal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("validates required fields before sending", async () => {
        render(<SendNotificationModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: /Send Notification/i }));

        expect(toast.error).toHaveBeenCalledWith("Please fill in all required fields.");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("sends a broadcast notification when broadcast mode is enabled", async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        vi.mocked(fetch).mockResolvedValueOnce(
            makeJsonResponse({
                message: "Broadcast sent successfully.",
            })
        );

        render(<SendNotificationModal isOpen onClose={onClose} onSuccess={onSuccess} />);

        fireEvent.change(screen.getByLabelText("Notification Title"), {
            target: { value: "Platform update" },
        });
        fireEvent.change(screen.getByLabelText("Content Message"), {
            target: { value: "New features are now live." },
        });
        fireEvent.click(screen.getByLabelText(/Broadcast to all/i));
        fireEvent.click(screen.getByRole("button", { name: /Send Notification/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/admin/notifications",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        title: "Platform update",
                        message: "New features are now live.",
                        type: "system",
                        broadcast: true,
                        user_id: null,
                    }),
                })
            );
        });

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("sends a targeted notification with the provided user id", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            makeJsonResponse({
                message: "Notification sent successfully.",
            })
        );

        render(<SendNotificationModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);

        fireEvent.change(screen.getByLabelText("Notification Title"), {
            target: { value: "Payment reminder" },
        });
        fireEvent.change(screen.getByLabelText("Content Message"), {
            target: { value: "Please upload your proof of payment." },
        });
        fireEvent.change(screen.getByLabelText("Recipient User ID"), {
            target: { value: "user-42" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Send Notification/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/admin/notifications",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        title: "Payment reminder",
                        message: "Please upload your proof of payment.",
                        type: "system",
                        broadcast: false,
                        user_id: "user-42",
                    }),
                })
            );
        });
    });
});
