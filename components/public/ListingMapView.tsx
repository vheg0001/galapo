"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ListingItem } from "./ListingGrid";
import { unwrapJoin } from "./ListingGrid";

const MapView = dynamic(() => import("@/components/shared/MapView"), { ssr: false });

interface ListingMapViewProps {
    listings: ListingItem[];
}

export default function ListingMapView({ listings }: ListingMapViewProps) {
    const pins = listings
        .filter((l) => l.lat && l.lng)
        .map((l) => {
            const cat = unwrapJoin<{ name: string; slug: string }>(l.categories);
            return {
                id: l.id,
                lat: l.lat!,
                lng: l.lng!,
                name: l.business_name,
                category: cat?.name,
                slug: l.slug,
                is_featured: l.is_featured,
                is_premium: l.is_premium || l.isSponsored,
            };
        });

    return (
        <div>
            <MapView pins={pins} className="h-[500px] w-full" />

            {/* Scrollable list below map */}
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
                {listings.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">No businesses found on the map.</p>
                )}
                {listings.map((listing) => {
                    const cat = unwrapJoin<{ name: string; slug: string }>(listing.categories);
                    const brgy = unwrapJoin<{ name: string; slug: string }>(listing.barangays);

                    return (
                        <Link
                            key={listing.id}
                            href={`/listing/${listing.slug}`}
                            className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{listing.business_name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    {brgy?.name && (
                                        <>
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span>{brgy.name}</span>
                                        </>
                                    )}
                                    {cat?.name && (
                                        <span className="ml-2 text-secondary">{cat.name}</span>
                                    )}
                                </div>
                            </div>
                            {listing.phone && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{listing.phone}</span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
