import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnnualChecksTable from "@/components/admin/annual-checks/AnnualChecksTable";
import AutoCheckTrigger from "@/components/admin/annual-checks/AutoCheckTrigger";

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

    const DialogTrigger = ({ children, asChild }: any) => {
        const ctx = React.useContext(DialogContext);

        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children, {
                onClick: (event: any) => {
                    children.props.onClick?.(event);
                    ctx?.setOpen(true);
                },
            });
        }

        return (
            <button type="button" onClick={() => ctx?.setOpen(true)}>
                {children}
            </button>
        );
    };

    const DialogContent = ({ children }: any) => {
        const ctx = React.useContext(DialogContext);
        return ctx?.open ? <div>{children}</div> : null;
    };

    return {
        Dialog,
        DialogTrigger,
        DialogContent,
        DialogHeader: ({ children }: any) => <div>{children}</div>,
        DialogTitle: ({ children }: any) => <h2>{children}</h2>,
        DialogDescription: ({ children }: any) => <p>{children}</p>,
        DialogFooter: ({ children }: any) => <div>{children}</div>,
    };
});

const makeJsonResponse = (data: any) =>
    Promise.resolve({
        json: async () => data,
    } as Response);

const checksPayload = {
    checks: [
        {
            id: "check-1",
            status: "pending",
            sent_at: "2026-03-20T12:00:00.000Z",
            response_deadline: "2099-03-30T12:00:00.000Z",
            listing: {
                id: "listing-1",
                business_name: "Cafe Uno",
                slug: "cafe-uno",
            },
            owner: {
                full_name: "Jamie Santos",
                email: "jamie@example.com",
            },
        },
        {
            id: "check-2",
            status: "pending",
            sent_at: "2026-03-12T12:00:00.000Z",
            response_deadline: "2020-03-15T12:00:00.000Z",
            listing: {
                id: "listing-2",
                business_name: "Studio Two",
                slug: "studio-two",
            },
            owner: {
                full_name: "Bella Cruz",
                email: "bella@example.com",
            },
        },
    ],
    stats: {
        due_for_check: 3,
        pending_response: 1,
        no_response: 1,
        confirmed_this_month: 2,
    },
    total: 2,
};

describe("AnnualChecksTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("renders stats, listing rows, and overdue status styling from fetched data", async () => {
        vi.mocked(fetch).mockResolvedValueOnce(makeJsonResponse(checksPayload));

        render(<AnnualChecksTable />);

        expect(await screen.findByText("Cafe Uno")).toBeInTheDocument();
        expect(screen.getByText("Jamie Santos")).toBeInTheDocument();
        expect(screen.getByText("Studio Two")).toBeInTheDocument();
        expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
        expect(screen.getByText("Overdue")).toBeInTheDocument();
        expect(screen.getByText("Check Eligibility")).toBeInTheDocument();
        expect(screen.getByText("Waitng Response")).toBeInTheDocument();
        expect(screen.getByText("Overdue / Warning")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Run Batch Check/i })).toBeInTheDocument();

        expect(fetch).toHaveBeenCalledWith("/api/admin/annual-checks?status=&page=1");
    });

    it("updates the status filter and refetches the table", async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(makeJsonResponse(checksPayload))
            .mockResolvedValueOnce(makeJsonResponse(checksPayload));

        render(<AnnualChecksTable />);

        expect(await screen.findByText("Cafe Uno")).toBeInTheDocument();
        fireEvent.click(screen.getByTestId("select-item-confirmed"));

        await waitFor(() => {
            expect(fetch).toHaveBeenLastCalledWith("/api/admin/annual-checks?status=confirmed&page=1");
        });
    });
});

describe("AutoCheckTrigger", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("opens the dialog, triggers the batch route, and refreshes the parent table", async () => {
        const onTriggered = vi.fn();
        vi.mocked(fetch).mockResolvedValueOnce(
            makeJsonResponse({
                triggered_count: 5,
                message: "Checks queued for 5 listings.",
            })
        );

        render(<AutoCheckTrigger dueCount={5} onTriggered={onTriggered} />);

        fireEvent.click(screen.getByRole("button", { name: /Run Batch Check/i }));
        expect(screen.getByText("Batch Verification Trigger")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Trigger Verification/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith("/api/admin/annual-checks/batch-trigger", {
                method: "POST",
            });
        });

        expect(onTriggered).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith("Triggered checks for 5 listings!");
        expect(await screen.findByText("Checks queued for 5 listings.")).toBeInTheDocument();
    });
});
