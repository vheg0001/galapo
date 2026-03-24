"use client";

import { useState, useEffect } from "react";
import ListingCard from "@/components/shared/ListingCard";
import AdSlotClient from "@/components/shared/AdSlotClient";
import Pagination from "@/components/shared/Pagination";
import SponsoredBadge from "./SponsoredBadge";
import { unwrapJoin, JoinResult } from "./ListingGrid";

interface ListingListProps {
    listings: any[];
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
                    const cat = unwrapJoin<{ name: string; slug: string }>(listing.categories);
                    const sub = unwrapJoin<{ name: string; slug: string }>(listing.subcategories);
                    const brgy = unwrapJoin<{ name: string; slug: string }>(listing.barangays);

                    return (
                        <div key={listing.id}>
                            {listing.isSponsored && (
                                <div className="mb-2">
                                    <SponsoredBadge />
                                </div>
                            )}

                            <ListingCard
                                id={listing.id}
                                slug={listing.slug}
                                businessName={listing.business_name}
                                shortDescription={listing.short_description}
                                categoryName={cat?.name}
                                subcategoryName={sub?.name}
                                barangayName={brgy?.name}
                                phone={listing.phone}
                                logoUrl={listing.logo_url}
                                imageUrl={listing.image_url}
                                isFeatured={listing.is_featured}
                                isPremium={listing.is_premium}
                                isNew={mounted && new Date(listing.created_at) > sevenDaysAgo}
                                priority={index < 4}
                                layout="list"
                                badges={listing.badges || []}
                            />

                            {/* Inline ad after every 5th listing */}
                            {(index + 1) % 5 === 0 && (
                                <div className="my-6">
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
