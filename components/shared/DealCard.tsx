import Link from "next/link";
import LazyImage from "./LazyImage";
import { MapPin, Tag, ChevronRight } from "lucide-react";
import BadgeDisplay from "./BadgeDisplay";
import DiscountBadge from "./DiscountBadge";
import ExpiryCountdown from "./ExpiryCountdown";
import { ListingBadge } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DealCardProps {
    id: string;
    listingSlug: string;
    title: string;
    description: string;
    businessName: string;
    discountText: string;
    imageUrl?: string | null;
    endDate: string;
    categoryName?: string;
    barangayName?: string;
    badges?: ListingBadge[];
    isPremium?: boolean;
    isFeatured?: boolean;
    className?: string;
}

export default function DealCard({
    id,
    listingSlug,
    title,
    description,
    businessName,
    discountText,
    imageUrl,
    endDate,
    categoryName,
    barangayName,
    badges = [],
    isPremium = false,
    isFeatured = false,
    className,
}: DealCardProps) {
    return (
        <div className={cn("group flex w-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-background/40 shadow-sm backdrop-blur-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1", className)}>
            {/* Image & Overlay */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {imageUrl ? (
                    <LazyImage
                        src={imageUrl}
                        alt={title}
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-4xl bg-gradient-to-br from-primary/5 to-primary/10">🏷️</div>
                )}

                {/* Discount Badge Overlay */}
                <div className="absolute right-4 top-4 z-10">
                    <DiscountBadge text={discountText} size="md" />
                </div>

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-5">
                <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Link
                            href={`/olongapo/${listingSlug}`}
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline line-clamp-1"
                        >
                            {businessName}
                        </Link>
                        <BadgeDisplay
                            badges={badges}
                            isPremium={isPremium}
                            isFeatured={isFeatured}
                            mode="card"
                            size="sm"
                            className="scale-90 origin-right shrink-0"
                        />
                    </div>
                    <h3 className="text-lg font-bold leading-tight text-foreground line-clamp-1 min-h-[1.5rem]">
                        {title}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground/80 line-clamp-2 leading-relaxed min-h-[2.8rem]">
                        {description}
                    </p>
                </div>

                <div className="mt-auto space-y-4">
                    {/* Expiry & Tags */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-border/40">
                        <ExpiryCountdown endDate={endDate} />

                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                            {categoryName && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span>{categoryName}</span>
                                </div>
                            )}
                            {barangayName && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{barangayName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* View Button */}
                    <Link
                        href={`/olongapo/${listingSlug}?tab=deals&id=${id}`}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                    >
                        View Deal
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
