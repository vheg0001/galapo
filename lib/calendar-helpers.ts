import { format, isSameDay, parseISO } from "date-fns";
import type { Event } from "@/lib/types";

type CalendarEventLike = Pick<
    Event,
    | "title"
    | "description"
    | "event_date"
    | "start_time"
    | "end_time"
    | "venue"
    | "venue_address"
    | "slug"
>;

function parseEventDate(date: string) {
    return parseISO(date.includes("T") ? date : `${date}T00:00:00`);
}

function formatTimeValue(time?: string | null) {
    if (!time) return null;

    const normalized = time.length === 5 ? `${time}:00` : time;
    const parsed = parseISO(`1970-01-01T${normalized}`);

    if (Number.isNaN(parsed.getTime())) return null;

    return format(parsed, "h:mm a");
}

function toCalendarDateTime(date: string, time?: string | null) {
    const safeTime = time ? (time.length === 5 ? `${time}:00` : time) : "00:00:00";
    const parsed = parseISO(`${date.split("T")[0]}T${safeTime}`);
    return format(parsed, "yyyyMMdd'T'HHmmss");
}

export function generateGoogleCalendarUrl(event: CalendarEventLike) {
    const start = toCalendarDateTime(event.event_date, event.start_time ?? undefined);
    const end = toCalendarDateTime(
        event.event_date,
        event.end_time || event.start_time || "23:59:59"
    );

    const details = [event.description, event.venue, event.venue_address]
        .filter(Boolean)
        .join("\n\n");

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        dates: `${start}/${end}`,
        details,
        location: [event.venue, event.venue_address].filter(Boolean).join(", "),
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICSFile(event: CalendarEventLike) {
    const dtStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    const dtStart = toCalendarDateTime(event.event_date, event.start_time ?? undefined);
    const dtEnd = toCalendarDateTime(
        event.event_date,
        event.end_time || event.start_time || "23:59:59"
    );
    const description = (event.description || "")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GalaPo//Events//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${event.slug || event.title.replace(/\s+/g, "-").toLowerCase()}@galapo`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${event.title.replace(/,/g, "\\,")}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${[event.venue, event.venue_address].filter(Boolean).join(", ").replace(/,/g, "\\,")}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
}

export function groupEventsByDate<T extends Pick<Event, "event_date">>(events: T[]) {
    return events.reduce<Record<string, T[]>>((groups, event) => {
        const key = event.event_date.split("T")[0];
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
        return groups;
    }, {});
}

export function getDaysInMonth(year: number, month: number) {
    const date = new Date(year, month - 1, 1);
    const days: Date[] = [];

    while (date.getMonth() === month - 1) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }

    return days;
}

export function isToday(date: string | Date) {
    const value = typeof date === "string" ? parseEventDate(date) : date;
    return isSameDay(value, new Date());
}

export function isPastEvent(event: Pick<Event, "event_date" | "end_time">) {
    const today = new Date();
    const eventDate = parseEventDate(event.event_date);

    if (eventDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        return true;
    }

    if (!isSameDay(eventDate, today) || !event.end_time) {
        return false;
    }

    const endTime = parseISO(`1970-01-01T${event.end_time.length === 5 ? `${event.end_time}:00` : event.end_time}`);
    const endDateTime = new Date(eventDate);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    return endDateTime < today;
}

export function formatEventTime(startTime?: string | null, endTime?: string | null) {
    const start = formatTimeValue(startTime);
    const end = formatTimeValue(endTime);

    if (!start && !end) return "All Day";
    if (start && end) return `${start} - ${end}`;
    return start || end || "All Day";
}