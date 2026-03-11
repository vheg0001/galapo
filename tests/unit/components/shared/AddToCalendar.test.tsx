import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddToCalendar from "@/components/shared/AddToCalendar";

describe("AddToCalendar", () => {
    const event = {
        title: "City Fiesta",
        description: "A full-day celebration in Olongapo City.",
        event_date: "2026-01-15",
        start_time: "08:00",
        end_time: "18:00",
        venue: "City Plaza",
        venue_address: "Rizal Avenue, Olongapo City",
        slug: "city-fiesta",
    };

    beforeEach(() => {
        vi.stubGlobal("URL", {
            ...URL,
            createObjectURL: vi.fn(() => "blob:test"),
            revokeObjectURL: vi.fn(),
        });
    });

    it("renders Google Calendar link with correct params", () => {
        render(<AddToCalendar event={event as any} />);

        const googleLink = screen.getByRole("link", { name: /google calendar/i });
        expect(googleLink).toHaveAttribute("href", expect.stringContaining("calendar.google.com"));
        expect(googleLink).toHaveAttribute("href", expect.stringContaining("text=City+Fiesta"));
        expect(googleLink).toHaveAttribute("href", expect.stringContaining("dates=20260115T080000%2F20260115T180000"));
    });

    it("downloads .ics file when button is clicked", () => {
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { });
        render(<AddToCalendar event={event as any} />);

        fireEvent.click(screen.getByRole("button", { name: /download \.ics/i }));

        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        clickSpy.mockRestore();
    });

    it("correctly encodes event details in URLs", () => {
        render(
            <AddToCalendar
                event={{
                    ...event,
                    title: "Jazz & Food Night",
                    venue_address: "Magsaysay Drive, Olongapo City",
                } as any}
            />
        );

        const googleLink = screen.getByRole("link", { name: /google calendar/i });
        expect(googleLink).toHaveAttribute("href", expect.stringContaining("Jazz+%26+Food+Night"));
        expect(googleLink).toHaveAttribute("href", expect.stringContaining("Magsaysay+Drive%2C+Olongapo+City"));
    });

    it("handles events without an end time", () => {
        render(<AddToCalendar event={{ ...event, end_time: null } as any} />);

        const googleLink = screen.getByRole("link", { name: /google calendar/i });
        expect(googleLink).toHaveAttribute("href", expect.stringContaining("dates=20260115T080000%2F20260115T080000"));
    });
});