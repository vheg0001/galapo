"use client";

import { CalendarPlus, Download } from "lucide-react";
import { generateGoogleCalendarUrl, generateICSFile } from "@/lib/calendar-helpers";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

interface AddToCalendarProps {
    event: Pick<
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
    className?: string;
}

export default function AddToCalendar({ event, className }: AddToCalendarProps) {
    const googleUrl = generateGoogleCalendarUrl(event);

    const handleDownloadICS = () => {
        const content = generateICSFile(event);
        const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${event.slug || "event"}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-3", className)}>
            <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:scale-[1.02] hover:bg-primary/90"
            >
                <CalendarPlus className="h-4 w-4" />
                Google Calendar
            </a>

            <button
                type="button"
                onClick={handleDownloadICS}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted"
            >
                <Download className="h-4 w-4" />
                Download .ics
            </button>
        </div>
    );
}