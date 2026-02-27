import Link from "next/link";
import LazyImage from "./LazyImage";
import { Clock } from "lucide-react";
import Badge from "./Badge";

interface DealCardProps {
    id: string;
    listingSlug: string;
    title: string;
    businessName: string;
    discountText: string;
    imageUrl?: string | null;
    endDate: string;
}

export default function DealCard({
    listingSlug,
    title,
    businessName,
    discountText,
    imageUrl,
    endDate,
}: DealCardProps) {
    const daysLeft = Math.max(
        0,
        Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return (
        <Link
            href={`/listing/${listingSlug}`}
            className="group flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1 snap-start"
        >
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                {imageUrl ? (
                    <LazyImage
                        src={imageUrl}
                        alt={title}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🏷️</div>
                )}
                <div className="absolute right-3 top-3">
                    <Badge variant="deal">{discountText}</Badge>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col p-4">
                <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
                    {title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{businessName}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left` : "Ends today"}</span>
                </div>
            </div>
        </Link>
    );
}
