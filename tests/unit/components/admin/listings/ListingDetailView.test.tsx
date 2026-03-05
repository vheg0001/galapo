import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListingDetailView from "@/components/admin/listings/ListingDetailView";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import ListingMetaCard from "@/components/admin/listings/ListingMetaCard";
import OwnerInfoCard from "@/components/admin/listings/OwnerInfoCard";
import AnalyticsSummary from "@/components/admin/listings/AnalyticsSummary";
import AdminNotesSection from "@/components/admin/listings/AdminNotesSection";

describe("ListingDetailView", () => {
    const listing = {
        id: "listing-1",
        business_name: "Cafe Uno",
        slug: "cafe-uno",
        status: "pending",
        categories: { name: "Food" },
        subcategory: { name: "Cafe" },
        phone: "0912 345 6789",
        email: "owner@cafe.com",
        website: "https://cafe.test",
        address: "123 Harbor St",
        short_description: "Great coffee",
        full_description: "Specialty coffee and brunch.",
        field_values: [{ id: "fv1", value: "24 seats", category_fields: { field_label: "Capacity" } }],
        logo_url: "https://img.test/logo.jpg",
        images: [{ id: "img1", image_url: "https://img.test/1.jpg", alt_text: "Photo 1" }],
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-02T00:00:00.000Z",
        last_verified_at: null,
        is_pre_populated: false,
        is_active: true,
        is_featured: false,
        is_premium: false,
        profiles: {
            full_name: "Owner One",
            email: "owner@cafe.com",
            phone: "0912 000 1111",
            created_at: "2024-01-01T00:00:00.000Z",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", vi.fn());
    });

    it("renders all listing information sections", () => {
        render(<ListingDetailView listing={listing} deals={[]} events={[]} />);
        expect(screen.getByText("Business Information")).toBeInTheDocument();
        expect(screen.getByText("Dynamic Fields")).toBeInTheDocument();
        expect(screen.getByText("Photos & Logo")).toBeInTheDocument();
        expect(screen.getByText("Deals & Events")).toBeInTheDocument();
        expect(screen.getByText(/Cafe Uno/i)).toBeInTheDocument();
    });

    it("status badge shows expected color class", () => {
        render(<StatusBadge status="pending" />);
        const badge = screen.getByText("Pending");
        expect(badge).toHaveClass("bg-yellow-100");
        expect(badge).toHaveClass("text-yellow-800");
    });

    it("approve and reject actions are shown for claimed pending owner section", () => {
        const onApproveClaim = vi.fn();
        const onRejectClaim = vi.fn();
        render(
            <OwnerInfoCard
                listing={{ ...listing, status: "claimed_pending", claim_proof_url: "https://cdn.test/proof.pdf" }}
                ownerListingsCount={2}
                onApproveClaim={onApproveClaim}
                onRejectClaim={onRejectClaim}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /Approve Claim/i }));
        fireEvent.click(screen.getByRole("button", { name: /Reject Claim/i }));
        expect(onApproveClaim).toHaveBeenCalledTimes(1);
        expect(onRejectClaim).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("link", { name: /View proof document/i })).toBeInTheDocument();
    });

    it("approve and reject actions are hidden for approved listings", () => {
        render(<OwnerInfoCard listing={{ ...listing, status: "approved" }} ownerListingsCount={1} />);
        expect(screen.queryByRole("button", { name: /Approve Claim/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Reject Claim/i })).not.toBeInTheDocument();
    });

    it("listing meta shows status badges for active and featured", () => {
        const onToggleActive = vi.fn();
        const onToggleFeatured = vi.fn();
        render(
            <ListingMetaCard
                listing={listing}
                onToggleActive={onToggleActive}
                onToggleFeatured={onToggleFeatured}
            />
        );
        expect(screen.getByText(/Active Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Featured Status/i)).toBeInTheDocument();
        expect(screen.getByText(/^Active$/i)).toBeInTheDocument();
        expect(screen.getByText(/^Not Featured$/i)).toBeInTheDocument();
    });

    it("owner info shows owner data and pre-populated fallback", () => {
        const { rerender } = render(<OwnerInfoCard listing={listing} ownerListingsCount={3} />);
        expect(screen.getByText(/Owner One/i)).toBeInTheDocument();
        expect(screen.getByText(/Total listings:/i)).toBeInTheDocument();

        rerender(<OwnerInfoCard listing={{ ...listing, profiles: null }} ownerListingsCount={0} />);
        expect(screen.getByText(/Pre-populated by admin/i)).toBeInTheDocument();
    });

    it("analytics summary displays stats", () => {
        render(
            <AnalyticsSummary
                analytics={{
                    total: 120,
                    views_this_month: 45,
                    phone: 10,
                    email: 5,
                    website: 20,
                    direction: 8,
                    daily_views_30d: [
                        { date: "2026-03-01", views: 4 },
                        { date: "2026-03-02", views: 9 },
                    ],
                }}
            />
        );
        expect(screen.getByText(/Total page views:/i)).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();
    });

    it("admin notes section allows adding notes", async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                note: {
                    id: "note-1",
                    note: "Needs manual verification",
                    created_at: "2026-03-05T12:00:00.000Z",
                    profiles: { full_name: "Admin One" },
                },
            }),
        });

        render(<AdminNotesSection listingId="listing-1" initialNotes={[]} />);
        fireEvent.change(screen.getByPlaceholderText(/Add a private note/i), {
            target: { value: "Needs manual verification" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Save Note/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/admin/listings/listing-1/notes",
                expect.objectContaining({ method: "POST" })
            );
        });
        expect(await screen.findByText(/Needs manual verification/i)).toBeInTheDocument();
    });
});
