import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EventsListView from "@/components/public/events/EventsListView";

type MockLinkProps = {
    href: string;
    children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: MockLinkProps) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("@/components/shared/LazyImage", () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("@/components/shared/BadgeDisplay", () => ({
    default: () => <div />,
}));

vi.mock("@/components/shared/AdSlot", () => ({
    default: ({ location }: { location: string }) => <div data-testid="ad-slot">{location}</div>,
}));

describe("EventsListView", () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const createEvent = (overrides: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        slug: crypto.randomUUID(),
        title: "Event",
        description: "Description",
        image_url: null,
        event_date: today,
        start_time: "08:00",
        end_time: "09:00",
        venue: "City Plaza",
        venue_address: "Olongapo City",
        is_city_wide: false,
        is_featured: false,
        created_by: "user-1",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    });

    it("groups events by date and shows Today header", () => {
        render(<EventsListView events={[createEvent({ title: "Today Event" }), createEvent({ title: "Tomorrow Event", event_date: tomorrow })] as any} />);

        expect(screen.getByText(/^Today —/i)).toBeInTheDocument();
        expect(screen.getByText(/Tomorrow Event/i)).toBeInTheDocument();
    });

    it("orders events chronologically within the same day", () => {
        render(
            <EventsListView
                events={[
                    createEvent({ title: "Late Event", start_time: "22:00" }),
                    createEvent({ title: "Early Event", start_time: "08:00" }),
                ] as any}
            />
        );

        const headings = screen.getAllByRole("heading", { level: 3 });
        expect(headings[0]).toHaveTextContent("Early Event");
        expect(headings[1]).toHaveTextContent("Late Event");
    });

    it("renders past events with grayed styling", () => {
        render(<EventsListView events={[createEvent({ title: "Past Event", event_date: yesterday })] as any} />);

        expect(screen.getByText("Past Event").closest("article")).toHaveClass("opacity-70");
    });

    it("renders an empty state when there are no events", () => {
        render(<EventsListView events={[]} />);

        expect(screen.getByText(/No events found/i)).toBeInTheDocument();
    });
});