"use client";

import { useState, useEffect } from "react";
import EventCard from "@/components/shared/EventCard";
import type { Event } from "@/lib/types";

interface EventsListProps {
    events: Event[];
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
    );
}
