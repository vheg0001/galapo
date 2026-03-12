import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EventsCalendarView from "@/components/public/events/EventsCalendarView";

const pushMock = vi.fn();
let currentSearchParams = new URLSearchParams("view=calendar&month=1&year=2026");

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
    usePathname: () => "/olongapo/events",
    useSearchParams: () => currentSearchParams,
}));

vi.mock("@/components/shared/EventCard", () => ({
    default: ({ title }: { title: string }) => <div data-testid="event-card">{title}</div>,
}));

describe("EventsCalendarView", () => {
    const createEvent = (overrides: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        slug: crypto.randomUUID(),
        title: "Calendar Event",
        description: "Description",
        image_url: null,
        event_date: "2026-01-15",
        start_time: "10:00",
        end_time: "12:00",
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

    beforeEach(() => {
        pushMock.mockReset();
        currentSearchParams = new URLSearchParams("view=calendar&month=1&year=2026");
    });

    it("renders the calendar grid for the month", () => {
        render(<EventsCalendarView events={[]} month={1} year={2026} />);

        expect(screen.getByText("January 2026")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("31")).toBeInTheDocument();
    });

    it("shows dots and event count on days with events", () => {
        const { container } = render(
            <EventsCalendarView
                events={[
                    createEvent({ title: "Morning Event" }),
                    createEvent({ title: "Evening Event" }),
                ] as any}
                month={1}
                year={2026}
            />
        );

        expect(screen.getByTestId("event-count")).toHaveTextContent("2");
        expect(container.querySelectorAll('span.h-2\\.5.w-2\\.5')).toHaveLength(2);
    });

    it("clicking a day shows events for that day", () => {
        render(<EventsCalendarView events={[createEvent({ title: "City Parade" })] as any} month={1} year={2026} />);

        fireEvent.click(screen.getByRole("button", { name: /15/i }));

        expect(screen.getByText("City Parade")).toBeInTheDocument();
    });

    it("navigates to previous and next month", () => {
        render(<EventsCalendarView events={[]} month={1} year={2026} />);

        fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
        expect(pushMock).toHaveBeenCalledWith("/olongapo/events?view=calendar&month=12&year=2025");

        fireEvent.click(screen.getByRole("button", { name: /next month/i }));
        expect(pushMock).toHaveBeenCalledWith("/olongapo/events?view=calendar&month=2&year=2026");
    });

    it("highlights today when current month is rendered", () => {
        const today = new Date();
        render(<EventsCalendarView events={[]} month={today.getMonth() + 1} year={today.getFullYear()} />);

        const todayButton = screen.getByRole("button", { name: new RegExp(`${today.getDate()}`) });
        expect(todayButton.className).toContain("ring-2");
    });
});