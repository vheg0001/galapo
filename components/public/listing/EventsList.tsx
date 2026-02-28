"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";

interface Event {
    id: string;
    title: string;
    slug: string;
    description: string;
    image_url: string | null;
    event_date: string;
    start_time: string;
    end_time: string | null;
    venue: string | null;
    venue_address: string;
    is_active: boolean;
}

interface EventsListProps {
    events: Event[];
}

function formatDate(d: string): string {
    return new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatTime(t: string): string {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

export default function EventsList({ events }: EventsListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !events || events.length === 0) return null;

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                >
                    {/* Image */}
                    {event.image_url && (
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {event.title}
                        </h4>

                        <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                                {formatDate(event.event_date)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                {formatTime(event.start_time)}
                                {event.end_time && ` – ${formatTime(event.end_time)}`}
                            </div>
                            {event.venue && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    {event.venue}
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
