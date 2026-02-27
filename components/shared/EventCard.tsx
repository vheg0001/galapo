import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";

interface EventCardProps {
    slug: string;
    title: string;
    imageUrl?: string | null;
    eventDate: string;
    startTime: string;
    endTime?: string | null;
    venue: string;
}

export default function EventCard({
    slug,
    title,
    imageUrl,
    eventDate,
    startTime,
    endTime,
    venue,
}: EventCardProps) {
    const dateObj = new Date(eventDate);
    const month = dateObj.toLocaleDateString("en-PH", { month: "short" }).toUpperCase();
    const day = dateObj.getDate();

    return (
        <Link
            href={`/events/${slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
        >
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🎉</div>
                )}

                {/* Date badge */}
                <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-white px-3 py-1.5 shadow-md">
                    <span className="text-[10px] font-bold text-secondary leading-none">{month}</span>
                    <span className="text-xl font-extrabold text-primary leading-tight">{day}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col p-4">
                <h3 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-secondary transition-colors">
                    {title}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{venue}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{startTime}{endTime ? ` – ${endTime}` : ""}</span>
                </div>
            </div>
        </Link>
    );
}
