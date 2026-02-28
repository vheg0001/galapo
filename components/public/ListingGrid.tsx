"use client";

import { useState, useEffect } from "react";
import ListingCard from "@/components/shared/ListingCard";
import AdSlotClient from "@/components/shared/AdSlotClient";
import Pagination from "@/components/shared/Pagination";
import SponsoredBadge from "./SponsoredBadge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JoinResult = Record<string, any> | Record<string, any>[] | null | undefined;

/** Normalize a Supabase join result that can be an object or array into a single object. */
function unwrapJoin<T>(val: JoinResult): T | undefined {
    if (!val) return undefined;
    if (Array.isArray(val)) return val[0] as T | undefined;
    return val as T;
}

export interface ListingItem {
    id: string;
    slug: string;
    business_name: string;
    short_description: string;
    phone?: string | null;
    logo_url?: string | null;
    image_url?: string | null;
    is_featured: boolean;
    is_premium: boolean;
    created_at: string;
    address?: string;
    operating_hours?: Record<string, unknown> | null;
    lat?: number | null;
    lng?: number | null;
    categories?: JoinResult;
    barangays?: JoinResult;
    isSponsored?: boolean;
}

interface ListingGridProps {
    listings: ListingItem[];
    currentPage: number;
    totalPages: number;
    basePath: string;
}

export default function ListingGrid({ listings, currentPage, totalPages, basePath }: ListingGridProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return (
        <div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing, index) => {
                    const cat = unwrapJoin<{ name: string; slug: string }>(listing.categories);
                    const brgy = unwrapJoin<{ name: string; slug: string }>(listing.barangays);

                    return (
                        <div key={listing.id}>
                            {listing.isSponsored && (
                                <div className="mb-1.5">
                                    <SponsoredBadge />
                                </div>
                            )}
                            <ListingCard
                                id={listing.id}
                                slug={listing.slug}
                                businessName={listing.business_name}
                                shortDescription={listing.short_description}
                                categoryName={cat?.name}
                                barangayName={brgy?.name}
                                phone={listing.phone}
                                logoUrl={listing.logo_url}
                                imageUrl={listing.image_url}
                                isFeatured={listing.is_featured}
                                isPremium={listing.is_premium}
                                isNew={mounted && new Date(listing.created_at) > sevenDaysAgo}
                                priority={index < 6}
                            />
                            {/* Inline ad after every 5th listing */}
                            {(index + 1) % 5 === 0 && (
                                <div className="col-span-full my-4">
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

export { unwrapJoin };
