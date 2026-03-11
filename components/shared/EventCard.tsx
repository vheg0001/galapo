import Link from "next/link";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { ListingBadge } from "@/lib/types";
import { formatEventTime, isPastEvent } from "@/lib/calendar-helpers";
import { cn } from "@/lib/utils";
import Badge from "./Badge";
import BadgeDisplay from "./BadgeDisplay";
import DateBadge from "./DateBadge";
import LazyImage from "./LazyImage";

interface EventCardProps {
    slug: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    eventDate: string;
    startTime?: string | null;
    endTime?: string | null;
    venue?: string | null;
    venueAddress?: string | null;
    listing?: {
        businessName: string;
        slug: string;
        badges?: ListingBadge[];
        isFeatured?: boolean;
        isPremium?: boolean;
    } | null;
    isCityWide?: boolean;
    isFeatured?: boolean;
    placeholderIcon?: string;
    variant?: "default" | "horizontal" | "featured";
    className?: string;
}

export default function EventCard({
    slug,
    title,
    description,
    imageUrl,
    eventDate,
    startTime,
    endTime,
    venue,
    venueAddress,
    listing,
    isCityWide = false,
    isFeatured = false,
    placeholderIcon,
    variant = "default",
    className,
}: EventCardProps) {
    const isPast = isPastEvent({ event_date: eventDate, end_time: endTime || null });
    const detailHref = `/olongapo/events/${slug}`;
    const listingHref = listing?.slug ? `/olongapo/${listing.slug}` : null;
    const timeLabel = formatEventTime(startTime || null, endTime || null);
    const horizontal = variant === "horizontal";
    const featured = variant === "featured";

    return (
        <article
            className={cn(
                "group overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
                horizontal ? "flex flex-col md:flex-row" : "flex flex-col",
                featured && "min-w-[21rem] md:min-w-[24rem]",
                isPast && "opacity-70 grayscale-[0.2]",
                className
            )}
        >
            <div
                className={cn(
                    "relative overflow-hidden bg-muted",
                    horizontal ? "md:w-72 md:shrink-0" : "w-full",
                    featured ? "aspect-[16/9]" : horizontal ? "aspect-[16/10] md:aspect-auto" : "aspect-[16/10]"
                )}
            >
                {imageUrl ? (
                    <LazyImage
                        src={imageUrl}
                        alt={title}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-5xl text-primary/70">
                        {placeholderIcon || <CalendarDays className="h-12 w-12" />}
                    </div>
                )}

                {!horizontal && (
                    <DateBadge
                        date={eventDate}
                        size={featured ? "lg" : "md"}
                        className="absolute left-4 top-4"
                    />
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                        {horizontal && <DateBadge date={eventDate} size="sm" />}

                        <div className="flex flex-wrap items-center gap-2">
                            {isCityWide ? (
                                <Badge className="bg-[#1B2A4A] text-white">City-Wide Event</Badge>
                            ) : (
                                <Badge className="bg-slate-100 text-slate-700">Business Event</Badge>
                            )}
                            {isFeatured && <Badge variant="featured">Featured</Badge>}
                            {isPast && <Badge className="bg-muted text-muted-foreground">Event ended</Badge>}
                        </div>

                        <div>
                            <Link href={detailHref} className="block">
                                <h3 className="text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
                                    {title}
                                </h3>
                            </Link>
                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                                    <span>{timeLabel}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>
                                        {[venue, venueAddress].filter(Boolean).join(" • ") || "Olongapo City"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {listing && listingHref && (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Hosted by</span>
                                <Link href={listingHref} className="font-bold text-primary hover:underline">
                                    {listing.businessName}
                                </Link>
                                {listing.badges && listing.badges.length > 0 && (
                                    <BadgeDisplay
                                        badges={listing.badges}
                                        isFeatured={listing.isFeatured}
                                        isPremium={listing.isPremium}
                                        mode="card"
                                        size="sm"
                                    />
                                )}
                            </div>
                        )}

                        {description && (
                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                {description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                    <span className={cn("text-xs font-bold uppercase tracking-[0.2em]", isPast ? "text-muted-foreground" : "text-primary")}>
                        {isPast ? "This event has ended" : "View event information"}
                    </span>
                    <Link href={detailHref} className="text-sm font-bold text-primary hover:underline">
                        View Details
                    </Link>
                </div>
            </div>
        </article>
    );
}
