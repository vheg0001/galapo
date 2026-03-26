import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerificationBanner from "@/components/business/dashboard/VerificationBanner";
import ListingVerificationPage from "@/app/business/listings/[id]/verify/page";

const { toast, useBusinessStoreMock, pushMock } = vi.hoisted(() => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
    useBusinessStoreMock: vi.fn(),
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
    useParams: () => ({ id: "listing-1" }),
    useSearchParams: () => new URLSearchParams("check_id=check-1"),
    useRouter: () => ({
        push: pushMock,
    }),
}));

vi.mock("react-hot-toast", () => ({
    toast,
}));

vi.mock("@/store/businessStore", () => ({
    useBusinessStore: () => useBusinessStoreMock(),
}));

const makeJsonResponse = (data: any) =>
    Promise.resolve({
        json: async () => data,
    } as Response);

describe("VerificationBanner", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useBusinessStoreMock.mockReturnValue({
            notifications: [],
        });
    });

    it("shows the active annual check message and verify link", () => {
        useBusinessStoreMock.mockReturnValue({
            notifications: [
                {
                    id: "notif-1",
                    type: "annual_check",
                    title: "Annual check",
                    message: "Action Required: Verify Cafe Uno before March 30.",
                    is_read: false,
                    data: {
                        listing_id: "listing-1",
                        check_id: "check-1",
                    },
                    created_at: "2026-03-26T12:00:00.000Z",
                },
            ],
        });

        render(<VerificationBanner />);

        expect(screen.getByText("Verification Required")).toBeInTheDocument();
        expect(screen.getByText("Verify Cafe Uno before March 30.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Verify Now/i })).toHaveAttribute(
            "href",
            "/business/listings/listing-1/verify?check_id=check-1"
        );
    });

    it("hides when there is no unread annual check notification", () => {
        useBusinessStoreMock.mockReturnValue({
            notifications: [
                {
                    id: "notif-2",
                    type: "payment_confirmed",
                    title: "Payment confirmed",
                    message: "Paid",
                    is_read: false,
                    data: {},
                    created_at: "2026-03-26T12:00:00.000Z",
                },
            ],
        });

        const { container } = render(<VerificationBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it("can be dismissed by the owner", () => {
        useBusinessStoreMock.mockReturnValue({
            notifications: [
                {
                    id: "notif-1",
                    type: "annual_check",
                    title: "Annual check",
                    message: "Action Required: Verify Cafe Uno before March 30.",
                    is_read: false,
                    data: {
                        listing_id: "listing-1",
                        check_id: "check-1",
                    },
                    created_at: "2026-03-26T12:00:00.000Z",
                },
            ],
        });

        render(<VerificationBanner />);
        fireEvent.click(screen.getByTitle("Dismiss"));

        expect(screen.queryByText("Verification Required")).not.toBeInTheDocument();
    });
});

describe("ListingVerificationPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("loads the listing and confirms the annual check response", async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(
                makeJsonResponse({
                    data: [
                        {
                            id: "listing-1",
                            business_name: "Cafe Uno",
                            address: "123 Harbor St",
                            category_name: "Cafe",
                            primary_image: null,
                            last_verified_at: "2025-03-26T12:00:00.000Z",
                        },
                    ],
                })
            )
            .mockResolvedValueOnce(
                makeJsonResponse({
                    success: true,
                    message: "Listing successfully verified for another year.",
                })
            );

        render(<ListingVerificationPage />);

        expect(await screen.findByText("Cafe Uno")).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText(/Example: Updated our closing time/i), {
            target: { value: "Still operating with the same hours." },
        });
        fireEvent.click(screen.getByRole("button", { name: /I Confirm This Business is Still Active/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                "/api/business/annual-check/respond",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        check_id: "check-1",
                        listing_id: "listing-1",
                        notes: "Still operating with the same hours.",
                    }),
                })
            );
        });

        expect(await screen.findByText("Verification Complete!")).toBeInTheDocument();
        expect(toast.success).toHaveBeenCalledWith("Listing verified successfully!");
    });
});
