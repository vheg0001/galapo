"use client";

import DealCard from "@/components/shared/DealCard";
import AdSlotClient from "@/components/shared/AdSlotClient";
import { Fragment } from "react";

interface Deal {
    id: string;
    title: string;
    description: string;
    discount_text: string;
    image_url: string | null;
    end_date: string;
    start_date: string;
    listing: {
        business_name: string;
        slug: string;
        is_featured: boolean;
        is_premium: boolean;
        category: { name: string };
        barangay: { name: string };
        listing_badges: { id: string; badge: any }[];
    };
}

interface DealsGridProps {
    deals: Deal[];
}

export default function DealsGrid({ deals }: DealsGridProps) {
    if (deals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-muted/30 text-4xl">🏷️</div>
                <h3 className="text-xl font-black tracking-tight text-foreground">No active deals right now</h3>
                <p className="mt-2 text-sm font-medium text-muted-foreground/60">Check back soon or browse our businesses to find great offers.</p>
                <button
                    onClick={() => window.location.href = '/olongapo/categories'}
                    className="mt-8 rounded-2xl bg-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    Browse Categories
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal, index) => (
                <Fragment key={deal.id}>
                    <DealCard
                        id={deal.id}
                        title={deal.title}
                        description={deal.description}
                        discountText={deal.discount_text}
                        imageUrl={deal.image_url}
                        endDate={deal.end_date}
                        startDate={deal.start_date}
                        listingSlug={deal.listing?.slug}
                        businessName={deal.listing?.business_name}
                        categoryName={deal.listing?.category?.name || "Uncategorized"}
                        barangayName={deal.listing?.barangay?.name || "Olongapo"}
                        isPremium={deal.listing?.is_premium}
                        isFeatured={deal.listing?.is_featured}
                        badges={deal.listing?.listing_badges?.map(lb => ({ id: lb.id, badge: lb.badge })) as any}
                    />

                    {/* Ad Slot after every 6th card */}
                    {(index + 1) % 6 === 0 && (
                        <div className="col-span-full py-8">
                            <AdSlotClient location="search_inline" position={Math.ceil((index + 1) / 6)} />
                        </div>
                    )}
                </Fragment>
            ))}
        </div>
    );
}
