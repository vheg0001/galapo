"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, Pencil, Power, Trash2 } from "lucide-react";
import type { Event } from "@/lib/types";
import { formatEventTime } from "@/lib/calendar-helpers";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";

interface EventsListProps {
    events: Event[];
    onToggleActive: (event: Event) => void;
    onDelete: (event: Event) => void;
}

function getStatus(event: Event) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const date = event.event_date.split("T")[0];
    if (date < today) return { label: "Past", className: "bg-slate-100 text-slate-600" };
    if (date === today) return { label: "Today", className: "bg-amber-100 text-amber-700" };
    return { label: "Upcoming", className: "bg-emerald-100 text-emerald-700" };
}

export default function EventsList({ events, onToggleActive, onDelete }: EventsListProps) {
    if (!events.length) {
        return (
            <EmptyState
                title="Create your first event"
                description="Promote grand openings, live music nights, and city happenings to GalaPo visitors."
                action={<Link href="/business/events/new" className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Create New Event</Link>}
            />
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => {
                const status = getStatus(event);
                return (
                    <article key={event.id} className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-5 shadow-sm md:flex-row md:items-center">
                        <div className="relative h-24 w-full overflow-hidden rounded-2xl bg-muted md:w-32 md:shrink-0">
                            {event.image_url ? (
                                <Image src={event.image_url} alt={event.title} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="flex h-full items-center justify-center text-3xl">🎉</div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]", status.className)}>{status.label}</span>
                                {event.is_featured && <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-secondary">Featured</span>}
                            </div>
                            <h3 className="truncate text-lg font-black tracking-tight text-foreground">{event.title}</h3>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{new Date(`${event.event_date.split("T")[0]}T00:00:00`).toLocaleDateString()}</span>
                                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />{formatEventTime(event.start_time, event.end_time)}</span>
                                <span>{event.venue}</span>
                                <span>{event.listing?.business_name || "City-wide event"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:self-stretch">
                            <Link href={`/business/events/${event.id}/edit`} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                                <Pencil className="h-4 w-4" />
                            </Link>
                            <button type="button" onClick={() => onToggleActive(event)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                                <Power className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => onDelete(event)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}