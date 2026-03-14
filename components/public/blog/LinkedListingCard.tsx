import Link from "next/link";
import type { BlogLinkedListing } from "@/lib/types";
import BadgeDisplay from "@/components/shared/BadgeDisplay";
import LazyImage from "@/components/shared/LazyImage";

interface LinkedListingCardProps {
    listing: BlogLinkedListing;
    compact?: boolean;
}

export default function LinkedListingCard({ listing, compact = false }: LinkedListingCardProps) {
    return (
        <div className="h-full rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm">
            <div className="flex h-full items-start gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {listing.logo_url || listing.image_url ? (
                        <LazyImage src={listing.logo_url || listing.image_url || "/placeholder-business.svg"} alt={listing.business_name} className="object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs font-bold text-primary">GP</div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col h-full">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/listing/${listing.slug}`} className="text-base font-bold text-foreground hover:text-secondary text-left">
                            {listing.business_name}
                        </Link>
                        {(listing.is_featured || listing.is_premium) && (
                            <span className="rounded-full bg-secondary/10 px-2 py-1 text-[11px] font-semibold text-secondary">Must Visit</span>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground text-left">
                        {[listing.category?.name, listing.barangay?.name].filter(Boolean).join(" · ")}
                    </p>

                    <p className={`mt-2 text-sm leading-6 text-muted-foreground text-left ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
                        “{listing.short_description}”
                    </p>

                    {listing.badges && listing.badges.length > 0 ? (
                        <div className="mt-3">
                            <BadgeDisplay badges={listing.badges} mode="card" size="sm" />
                        </div>
                    ) : null}

                    <div className="mt-auto pt-4 text-left">
                        <Link href={`/listing/${listing.slug}`} className="text-sm font-semibold text-secondary hover:underline">
                            View Listing →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}