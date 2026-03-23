"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import EventCard from "@/components/shared/EventCard";
import type { Event } from "@/lib/types";
import { Calendar } from "lucide-react";

interface EventsListProps {
    events: Event[];
}

export default function EventsList({ events }: EventsListProps) {
    const searchParams = useSearchParams();
    const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        const eventId = searchParams.get("id");
        if (eventId && eventRefs.current[eventId]) {
            setTimeout(() => {
                eventRefs.current[eventId]?.scrollIntoView({ behavior: "smooth", block: "center" });
                eventRefs.current[eventId]?.classList.add("ring-4", "ring-primary/20", "scale-[1.02]");
                setTimeout(() => {
                    eventRefs.current[eventId]?.classList.remove("ring-4", "ring-primary/20", "scale-[1.02]");
                }, 3000);
            }, 500);
        }
    }, [searchParams]);

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted/50 text-3xl opacity-50">
                    <Calendar className="h-10 w-10" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">No upcoming events</p>
                <p className="mt-2 max-w-[240px] text-sm font-medium">
                    This business hasn't posted any upcoming events yet. Check back soon!
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 py-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
                <div
                    key={event.id}
                    ref={(el: HTMLDivElement | null) => { eventRefs.current[event.id] = el; }}
                    className="flex h-full rounded-[2rem] transition-all duration-500"
                >
                    <EventCard
                        slug={event.slug}
                        title={event.title}
                        description={event.description}
                        imageUrl={event.image_url || undefined}
                        eventDate={event.event_date}
                        startTime={event.start_time || ""}
                        endTime={event.end_time || ""}
                        venue={event.venue}
                        venueAddress={event.venue_address}
                        isCityWide={event.is_city_wide}
                        isFeatured={event.is_featured}
                        listing={event.listing ? {
                            businessName: event.listing.business_name,
                            slug: event.listing.slug,
                            isFeatured: event.listing.is_featured,
                            isPremium: event.listing.is_premium,
                            badges: event.listing.listing_badges,
                        } : null}
                    />
                </div>
            ))}
        </div>
    );
}
