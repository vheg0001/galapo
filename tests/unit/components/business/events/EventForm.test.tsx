import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventForm from "@/components/business/events/EventForm";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/components/admin/pages/RichTextEditor", () => ({
    default: ({ value, onChange }: any) => (
        <textarea aria-label="Description" value={value} onChange={(event) => onChange(event.target.value)} />
    ),
}));

vi.mock("@/components/business/deals/ListingSearchSelect", () => ({
    default: ({ listings, value, onChange }: any) => (
        <select aria-label="Listing" value={value} onChange={(event) => onChange(event.target.value)}>
            <option value="">Select listing</option>
            {listings.map((listing: any) => (
                <option key={listing.id} value={listing.id}>{listing.business_name}</option>
            ))}
        </select>
    ),
}));

vi.mock("@/components/shared/EventCard", () => ({
    default: ({ title }: { title: string }) => <div data-testid="event-preview">{title}</div>,
}));

const uploadEventBannerMock = vi.fn().mockResolvedValue({ publicUrl: "https://example.com/uploaded-event.jpg" });

vi.mock("@/lib/supabase-storage", () => ({
    uploadEventBanner: (...args: any[]) => uploadEventBannerMock(...args),
}));

describe("EventForm", () => {
    const listings = [
        { id: "free-listing", business_name: "Free Listing", address: "Rizal Avenue", slug: "free-listing", is_featured: false, is_premium: false },
        { id: "premium-listing", business_name: "Premium Listing", address: "Magsaysay Drive", slug: "premium-listing", is_featured: true, is_premium: true },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        pushMock.mockReset();
        refreshMock.mockReset();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: { id: "event-1" } }),
        }) as any;
    });

    it("renders all important fields and listing options", () => {
        const { container } = render(<EventForm listings={listings} />);

        expect(screen.getByLabelText("Listing")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Free Listing" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Premium Listing" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Grand Opening Weekend/i)).toBeInTheDocument();
        expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
        expect(container.querySelector('input[type="time"]')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Venue name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Venue address/i)).toBeInTheDocument();
    });

    it("requires title, date, and start time with future-only date for new events", () => {
        const { container } = render(<EventForm listings={listings} />);
        const titleInput = screen.getByPlaceholderText(/Grand Opening Weekend/i) as HTMLInputElement;
        const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
        const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;

        expect(titleInput.required).toBe(true);
        expect(dateInput.required).toBe(true);
        expect(dateInput.min).toBe(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }));
        expect(timeInput.required).toBe(true);
    });

    it("same as business address auto-fills venue fields", () => {
        render(<EventForm listings={listings} />);

        fireEvent.change(screen.getByLabelText("Listing"), { target: { value: "premium-listing" } });
        fireEvent.click(screen.getByLabelText(/Same as business address/i));

        expect(screen.getByPlaceholderText(/Venue name/i)).toHaveValue("Premium Listing");
        expect(screen.getByPlaceholderText(/Venue address/i)).toHaveValue("Magsaysay Drive");
    });

    it("disables featured toggle for free plan and enables it for premium plan", () => {
        render(<EventForm listings={listings} />);
        const featuredToggle = screen.getByRole("checkbox", { name: "" });

        fireEvent.change(screen.getByLabelText("Listing"), { target: { value: "free-listing" } });
        expect(featuredToggle).toBeDisabled();

        fireEvent.change(screen.getByLabelText("Listing"), { target: { value: "premium-listing" } });
        expect(featuredToggle).not.toBeDisabled();
    });

    it("shows preview image when an image is uploaded", () => {
        const { container } = render(<EventForm listings={listings} />);
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["event"], "event.jpg", { type: "image/jpeg" });

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(screen.getByAltText("Event preview")).toBeInTheDocument();
    });

    it("submits the form and calls the API", async () => {
        const { container } = render(<EventForm listings={listings} />);

        fireEvent.change(screen.getByLabelText("Listing"), { target: { value: "premium-listing" } });
        fireEvent.change(screen.getByPlaceholderText(/Grand Opening Weekend/i), { target: { value: "Grand Opening" } });
        fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Live music and freebies." } });
        fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, { target: { value: "2026-01-15" } });
        fireEvent.change(container.querySelector('input[type="time"]') as HTMLInputElement, { target: { value: "18:00" } });
        fireEvent.change(screen.getByPlaceholderText(/Venue name/i), { target: { value: "City Plaza" } });
        fireEvent.change(screen.getByPlaceholderText(/Venue address/i), { target: { value: "Rizal Avenue, Olongapo City" } });

        fireEvent.click(screen.getByRole("button", { name: /Publish Event/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/business/events",
                expect.objectContaining({ method: "POST" })
            );
            expect(pushMock).toHaveBeenCalledWith("/business/events");
        });
    });

    it("pre-fills values in edit mode", () => {
        const { container } = render(
            <EventForm
                listings={listings}
                isEditing
                initialData={{
                    id: "event-1",
                    listing_id: "premium-listing",
                    title: "Existing Event",
                    description: "Existing description",
                    event_date: "2026-02-20",
                    start_time: "09:00",
                    end_time: "10:00",
                    venue: "Convention Center",
                    venue_address: "Downtown Olongapo",
                    is_featured: true,
                }}
            />
        );

        expect(screen.getByLabelText("Listing")).toHaveValue("premium-listing");
        expect(screen.getByPlaceholderText(/Grand Opening Weekend/i)).toHaveValue("Existing Event");
        expect(screen.getByLabelText("Description")).toHaveValue("Existing description");
        expect(container.querySelector('input[type="date"]')).toHaveValue("2026-02-20");
        expect(screen.getByPlaceholderText(/Venue name/i)).toHaveValue("Convention Center");
    });
});