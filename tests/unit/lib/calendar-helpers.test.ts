import { describe, expect, it } from "vitest";
import {
    formatEventTime,
    generateGoogleCalendarUrl,
    generateICSFile,
    groupEventsByDate,
    isPastEvent,
    isToday,
} from "@/lib/calendar-helpers";

describe("calendar-helpers", () => {
    const baseEvent = {
        title: "Olongapo Music Night",
        description: "Live bands and performances by the bay.",
        event_date: "2026-01-15",
        start_time: "19:00",
        end_time: "23:00",
        venue: "Boardwalk Stage",
        venue_address: "Boardwalk, Olongapo City",
        slug: "olongapo-music-night",
    };

    it("generateGoogleCalendarUrl contains correct params", () => {
        const url = generateGoogleCalendarUrl(baseEvent);

        expect(url).toContain("https://calendar.google.com/calendar/render?");
        expect(url).toContain("action=TEMPLATE");
        expect(url).toContain("text=Olongapo+Music+Night");
        expect(url).toContain("dates=20260115T190000%2F20260115T230000");
        expect(url).toContain("location=Boardwalk+Stage%2C+Boardwalk%2C+Olongapo+City");
    });

    it("generateICSFile produces valid .ics format", () => {
        const ics = generateICSFile(baseEvent);

        expect(ics).toContain("BEGIN:VCALENDAR");
        expect(ics).toContain("BEGIN:VEVENT");
        expect(ics).toContain("SUMMARY:Olongapo Music Night");
        expect(ics).toContain("DTSTART:20260115T190000");
        expect(ics).toContain("DTEND:20260115T230000");
        expect(ics).toContain("END:VEVENT");
        expect(ics).toContain("END:VCALENDAR");
    });

    it("groupEventsByDate groups correctly", () => {
        const grouped = groupEventsByDate([
            { id: "1", event_date: "2026-01-15" },
            { id: "2", event_date: "2026-01-15T00:00:00" },
            { id: "3", event_date: "2026-01-16" },
        ] as any);

        expect(Object.keys(grouped)).toEqual(["2026-01-15", "2026-01-16"]);
        expect(grouped["2026-01-15"]).toHaveLength(2);
        expect(grouped["2026-01-16"]).toHaveLength(1);
    });

    it("formatEventTime formats both times correctly", () => {
        expect(formatEventTime("19:00", "23:00")).toBe("7:00 PM - 11:00 PM");
    });

    it("formatEventTime formats single start time correctly", () => {
        expect(formatEventTime("19:00", null)).toBe("7:00 PM");
    });

    it("formatEventTime returns All Day when no times are provided", () => {
        expect(formatEventTime(null, null)).toBe("All Day");
    });

    it("isPastEvent returns true for past dates and false for today/future", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const today = new Date();

        expect(isPastEvent({ event_date: yesterday.toISOString().split("T")[0], end_time: null } as any)).toBe(true);
        expect(isPastEvent({ event_date: tomorrow.toISOString().split("T")[0], end_time: null } as any)).toBe(false);
        expect(isPastEvent({ event_date: today.toISOString().split("T")[0], end_time: null } as any)).toBe(false);
    });

    it("isToday identifies today and excludes other days", () => {
        const today = new Date();
        const otherDay = new Date();
        otherDay.setDate(otherDay.getDate() + 2);

        expect(isToday(today)).toBe(true);
        expect(isToday(today.toISOString().split("T")[0])).toBe(true);
        expect(isToday(otherDay)).toBe(false);
    });
});