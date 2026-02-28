"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LazyImage from "@/components/shared/LazyImage";
import SponsoredBadge from "./SponsoredBadge";
import Badge from "@/components/shared/Badge";
import Pagination from "@/components/shared/Pagination";
import AdSlotClient from "@/components/shared/AdSlotClient";
import { MapPin, Phone, Clock } from "lucide-react";
import { truncateText } from "@/lib/utils";
import type { ListingItem } from "./ListingGrid";
import { unwrapJoin } from "./ListingGrid";

interface ListingListProps {
    listings: ListingItem[];
    currentPage: number;
    totalPages: number;
    basePath: string;
}

export default function ListingList({ listings, currentPage, totalPages, basePath }: ListingListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return (
        <div>
            <div className="space-y-4">
                {listings.map((listing, index) => {
                    const displayImage = listing.image_url || listing.logo_url || "/placeholder-business.svg";
                    const isNew = mounted && new Date(listing.created_at) > sevenDaysAgo;
                    const cat = unwrapJoin<{ name: string; slug: string }>(listing.categories);
                    const brgy = unwrapJoin<{ name: string; slug: string }>(listing.barangays);

                    return (
                        <div key={listing.id}>
                            <Link
                                href={`/listing/${listing.slug}`}
                                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg sm:flex-row"
                            >
                                {/* Image */}
                                <div className="relative w-full shrink-0 overflow-hidden bg-muted sm:w-48 md:w-56">
                                    <div className="aspect-[16/10] sm:aspect-auto sm:h-full">
                                        <LazyImage
                                            src={displayImage}
                                            alt={listing.business_name}
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            priority={index < 4}
                                        />
                                    </div>
                                    {/* Badges */}
                                    <div className="absolute left-3 top-3 flex flex-col gap-1">
                                        {listing.isSponsored && <SponsoredBadge />}
                                        {listing.is_featured && <Badge variant="featured">Featured</Badge>}
                                        {listing.is_premium && <Badge variant="premium">Premium</Badge>}
                                        {isNew && <Badge variant="new">New</Badge>}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="text-base font-semibold text-foreground group-hover:text-secondary transition-colors">
                                        {listing.business_name}
                                    </h3>

                                    {cat?.name && (
                                        <span className="mt-0.5 text-xs font-medium text-secondary">
                                            {cat.name}
                                        </span>
                                    )}

                                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                                        {truncateText(listing.short_description, 200)}
                                    </p>

                                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs text-muted-foreground">
                                        {listing.address && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {brgy?.name || listing.address}
                                            </span>
                                        )}
                                        {listing.phone && (
                                            <span className="inline-flex items-center gap-1">
                                                <Phone className="h-3 w-3 shrink-0" />
                                                {listing.phone}
                                            </span>
                                        )}
                                        {listing.operating_hours && (
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3 shrink-0" />
                                                See hours
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            {/* Inline ad after every 5th listing */}
                            {(index + 1) % 5 === 0 && (
                                <div className="my-4">
                                    <AdSlotClient location="search_inline" position={Math.ceil((index + 1) / 5)} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {listings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-lg font-medium text-foreground">No businesses found</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Try adjusting your filters or search in a different category.
                    </p>
                </div>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={basePath}
                className="mt-8"
            />
        </div>
    );
}
