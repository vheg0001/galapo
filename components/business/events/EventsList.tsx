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
                const isActive = event.is_active;

                return (
                    <article
                        key={event.id}
                        className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:flex-row sm:items-center"
                    >
                        {/* Image */}
                        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-20 sm:w-32">
                            {event.image_url ? (
                                <Image src={event.image_url} alt={event.title} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="flex h-full items-center justify-center text-2xl">🎉</div>
                            )}
                            <div className="absolute left-1 top-1">
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm",
                                        isActive ? "bg-emerald-500" : "bg-slate-400"
                                    )}
                                >
                                    {isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", status.className)}>
                                    {status.label}
                                </span>
                                {event.is_featured && (
                                    <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-secondary">
                                        Featured
                                    </span>
                                )}
                            </div>
                            <h3 className="truncate text-base font-black tracking-tight text-foreground">{event.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                    <CalendarDays className="h-3 w-3 text-primary" />
                                    {new Date(`${event.event_date.split("T")[0]}T00:00:00`).toLocaleDateString()}
                                </span>
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                    <Clock3 className="h-3 w-3 text-primary" />
                                    {formatEventTime(event.start_time, event.end_time)}
                                </span>
                                <span className="truncate">
                                    Listing: <span className="font-bold text-foreground/70">{event.listing?.business_name || "City-wide"}</span>
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
                            <Link
                                href={`/business/events/${event.id}/edit`}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                title="Edit Event"
                            >
                                <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => onToggleActive(event)}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                                    isActive
                                        ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                )}
                                title={isActive ? "Deactivate" : "Activate"}
                            >
                                <Power className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(event)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                                title="Delete Event"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}