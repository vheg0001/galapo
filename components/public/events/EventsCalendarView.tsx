"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/lib/types";
import { getDaysInMonth, isToday as checkIsToday } from "@/lib/calendar-helpers";
import { cn } from "@/lib/utils";
import EventCard from "@/components/shared/EventCard";
import EmptyState from "@/components/shared/EmptyState";

interface EventsCalendarViewProps {
    events: Event[];
    month: number;
    year: number;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EventsCalendarView({ events, month, year }: EventsCalendarViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const grouped = useMemo(() => {
        return events.reduce<Record<string, Event[]>>((acc, event) => {
            const key = event.event_date.split("T")[0];
            if (!acc[key]) acc[key] = [];
            acc[key].push(event);
            return acc;
        }, {});
    }, [events]);

    const days = useMemo(() => getDaysInMonth(year, month), [month, year]);
    const firstDay = days[0] ? days[0].getDay() : 0;

    const initialSelectedDay = useMemo(() => {
        const todayKey = format(new Date(), "yyyy-MM-dd");
        if (grouped[todayKey]) return todayKey;
        return Object.keys(grouped)[0] || null;
    }, [grouped]);

    const [selectedDay, setSelectedDay] = useState<string | null>(initialSelectedDay);

    useEffect(() => {
        setSelectedDay(initialSelectedDay);
    }, [initialSelectedDay, month, year]);

    const goToMonth = (nextMonth: number, nextYear: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("view", "calendar");
        params.set("month", `${nextMonth}`);
        params.set("year", `${nextYear}`);
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };

    const prev = () => {
        if (month === 1) goToMonth(12, year - 1);
        else goToMonth(month - 1, year);
    };

    const next = () => {
        if (month === 12) goToMonth(1, year + 1);
        else goToMonth(month + 1, year);
    };

    const selectedEvents = selectedDay ? grouped[selectedDay] || [] : [];

    return (
        <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={prev}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background transition hover:bg-muted"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        {format(new Date(year, month - 1, 1), "MMMM yyyy")}
                    </h2>
                    <button
                        type="button"
                        onClick={next}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background transition hover:bg-muted"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {weekdayLabels.map((label) => (
                        <div key={label} className="py-2">{label}</div>
                    ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDay }).map((_, index) => (
                        <div key={`blank-${index}`} className="min-h-28 rounded-2xl bg-muted/20" />
                    ))}

                    {days.map((day) => {
                        const key = format(day, "yyyy-MM-dd");
                        const dayEvents = grouped[key] || [];
                        const today = checkIsToday(day);
                        const selected = selectedDay === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedDay(key)}
                                className={cn(
                                    "min-h-28 rounded-2xl border p-3 text-left transition-all",
                                    selected ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-background hover:bg-muted/40",
                                    today && "ring-2 ring-primary/20"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className={cn("text-sm font-black", today ? "text-primary" : "text-foreground")}>{day.getDate()}</span>
                                    {dayEvents.length > 0 && (
                                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary/15 px-2 text-[11px] font-black text-secondary">
                                            {dayEvents.length}
                                        </span>
                                    )}
                                </div>

                                {today && (
                                    <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.18em] text-primary">Today</span>
                                )}

                                {dayEvents.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <span
                                                key={event.id}
                                                className={cn(
                                                    "h-2.5 w-2.5 rounded-full",
                                                    event.is_city_wide ? "bg-primary" : "bg-secondary"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-foreground">
                            {selectedDay ? format(new Date(`${selectedDay}T00:00:00`), "EEEE, MMMM d") : "Select a day"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"} scheduled
                        </p>
                    </div>
                </div>

                {selectedEvents.length > 0 ? (
                    <div className="space-y-4">
                        {selectedEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                slug={event.slug}
                                title={event.title}
                                description={event.description}
                                imageUrl={event.image_url}
                                eventDate={event.event_date}
                                startTime={event.start_time}
                                endTime={event.end_time}
                                venue={event.venue}
                                venueAddress={event.venue_address}
                                isCityWide={event.is_city_wide}
                                isFeatured={Boolean(event.is_featured || event.listing?.is_featured || event.listing?.is_premium)}
                                listing={event.listing ? {
                                    businessName: event.listing.business_name,
                                    slug: event.listing.slug,
                                    badges: event.listing.listing_badges,
                                    isFeatured: event.listing.is_featured,
                                    isPremium: event.listing.is_premium,
                                } : null}
                                variant="horizontal"
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState title="No events on this day" description="Pick another date to explore more events in Olongapo City." />
                )}
            </section>
        </div>
    );
}