"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Event } from "@/lib/types";
import EventCard from "@/components/shared/EventCard";

interface FeaturedEventsProps {
    events: Event[];
}

export default function FeaturedEvents({ events }: FeaturedEventsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!events.length) return null;

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.8;
        scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    };

    return (
        <section className="space-y-5 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                        <Star className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Featured Events</h2>
                        <p className="text-sm text-muted-foreground">Highlighted happenings around Olongapo City</p>
                    </div>
                </div>

                <div className="hidden items-center gap-2 md:flex">
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
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
                        variant="featured"
                    />
                ))}
            </div>
        </section>
    );
}