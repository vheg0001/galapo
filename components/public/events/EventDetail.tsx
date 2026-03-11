import { format } from "date-fns";
import type { Event } from "@/lib/types";
import { formatEventTime } from "@/lib/calendar-helpers";
import AddToCalendar from "@/components/shared/AddToCalendar";
import Badge from "@/components/shared/Badge";
import BadgeDisplay from "@/components/shared/BadgeDisplay";
import DateBadge from "@/components/shared/DateBadge";
import EventCard from "@/components/shared/EventCard";
import LazyImage from "@/components/shared/LazyImage";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import EventVenueMap from "./EventVenueMap";

interface EventDetailProps {
    event: Event;
    relatedEvents: Event[];
}

export default function EventDetail({ event, relatedEvents }: EventDetailProps) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph";
    const eventUrl = `${appUrl}/olongapo/events/${event.slug}`;
    const formattedDate = format(new Date(`${event.event_date.split("T")[0]}T00:00:00`), "EEEE, MMMM d, yyyy");
    const eventType = event.is_city_wide ? "City-Wide Event" : "Business Event";

    return (
        <div className="space-y-10">
            <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-sm">
                <div className="relative aspect-[21/9] bg-muted">
                    {event.image_url ? (
                        <LazyImage src={event.image_url} alt={event.title} className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary text-6xl text-white/90">
                            ✨
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="absolute left-6 top-6 flex flex-wrap items-center gap-3">
                        <DateBadge date={event.event_date} size="lg" />
                        <Badge className={event.is_city_wide ? "bg-[#1B2A4A] text-white" : "bg-white/90 text-slate-800"}>
                            {eventType}
                        </Badge>
                        {event.is_featured && <Badge variant="featured">Featured</Badge>}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <h1 className="max-w-4xl text-3xl font-black tracking-tight text-white md:text-5xl">
                            {event.title}
                        </h1>
                    </div>
                </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-8">
                    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date</p>
                                <p className="mt-2 text-lg font-bold text-foreground">{formattedDate}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Time</p>
                                <p className="mt-2 text-lg font-bold text-foreground">
                                    {formatEventTime(event.start_time, event.end_time)}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Venue</p>
                                <p className="mt-2 text-lg font-bold text-foreground">{event.venue || "Olongapo City"}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{event.venue_address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Location</h2>
                        <div className="mt-5">
                            <EventVenueMap
                                venue={event.venue || event.title}
                                venueAddress={event.venue_address}
                                lat={event.listing?.lat}
                                lng={event.listing?.lng}
                            />
                        </div>
                    </div>

                    {!event.is_city_wide && event.listing && (
                        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Hosted by</p>
                            <div className="mt-4 rounded-[1.5rem] border border-border bg-background p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <a href={`/olongapo/${event.listing.slug}`} className="text-xl font-black tracking-tight text-primary hover:underline">
                                            {event.listing.business_name}
                                        </a>
                                        <p className="mt-1 text-sm text-muted-foreground">{event.listing.address}</p>
                                    </div>
                                    <BadgeDisplay
                                        badges={event.listing.listing_badges || []}
                                        isFeatured={event.listing.is_featured}
                                        isPremium={event.listing.is_premium}
                                        mode="card"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
                        <h2 className="text-2xl font-black tracking-tight text-foreground">About this event</h2>
                        <div
                            className="prose prose-sm mt-5 max-w-none text-muted-foreground dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: event.description || "<p>No event description provided.</p>" }}
                        />
                    </div>

                    <div className="space-y-5">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">More Events</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Discover other upcoming events in and around Olongapo City.</p>
                        </div>
                        <div className="grid gap-5 lg:grid-cols-2">
                            {relatedEvents.map((relatedEvent) => (
                                <EventCard
                                    key={relatedEvent.id}
                                    slug={relatedEvent.slug}
                                    title={relatedEvent.title}
                                    description={relatedEvent.description}
                                    imageUrl={relatedEvent.image_url}
                                    eventDate={relatedEvent.event_date}
                                    startTime={relatedEvent.start_time}
                                    endTime={relatedEvent.end_time}
                                    venue={relatedEvent.venue}
                                    venueAddress={relatedEvent.venue_address}
                                    isCityWide={relatedEvent.is_city_wide}
                                    isFeatured={Boolean(relatedEvent.is_featured || relatedEvent.listing?.is_featured || relatedEvent.listing?.is_premium)}
                                    listing={relatedEvent.listing ? {
                                        businessName: relatedEvent.listing.business_name,
                                        slug: relatedEvent.listing.slug,
                                        badges: relatedEvent.listing.listing_badges,
                                        isFeatured: relatedEvent.listing.is_featured,
                                        isPremium: relatedEvent.listing.is_premium,
                                    } : null}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
                    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                        <h3 className="text-lg font-black tracking-tight text-foreground">Share this event</h3>
                        <div className="mt-4">
                            <SocialShareButtons url={eventUrl} title={event.title} />
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                        <h3 className="text-lg font-black tracking-tight text-foreground">Add to Calendar</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Save this event to your Google Calendar, Apple Calendar, or Outlook.</p>
                        <AddToCalendar event={event} className="mt-5" />
                    </div>
                </aside>
            </section>
        </div>
    );
}