import { format, parseISO } from "date-fns";
import type { Event } from "@/lib/types";
import { groupEventsByDate, isToday as checkIsToday } from "@/lib/calendar-helpers";
import AdSlot from "@/components/shared/AdSlot";
import EmptyState from "@/components/shared/EmptyState";
import EventCard from "@/components/shared/EventCard";

interface EventsListViewProps {
    events: Event[];
}

function formatDateHeader(dateKey: string) {
    const date = parseISO(`${dateKey}T00:00:00`);
    const label = format(date, "EEEE, MMMM d, yyyy");
    return checkIsToday(date) ? `Today — ${label}` : label;
}

export default function EventsListView({ events }: EventsListViewProps) {
    if (!events.length) {
        return (
            <EmptyState
                title="No events found"
                description="Try a different filter or check back later for new happenings in Olongapo City."
            />
        );
    }

    const grouped = groupEventsByDate(events);
    const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    let renderIndex = 0;

    return (
        <div className="space-y-10">
            {sortedDates.map((dateKey) => {
                const dayEvents = grouped[dateKey].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
                const today = checkIsToday(dateKey);

                return (
                    <section key={dateKey} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${today ? "bg-primary" : "bg-secondary"}`} />
                            <h2 className={`text-2xl font-black tracking-tight ${today ? "text-primary" : "text-foreground"}`}>
                                {formatDateHeader(dateKey)}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {dayEvents.map((event) => {
                                renderIndex += 1;
                                return (
                                    <div key={event.id} className="space-y-4">
                                        <EventCard
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

                                        {renderIndex % 6 === 0 && <AdSlot location="search_inline" />}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}