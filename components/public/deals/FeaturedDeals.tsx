"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import DealCard from "@/components/shared/DealCard";
import { ListingBadge } from "@/lib/types";

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

interface FeaturedDealsProps {
    deals: Deal[];
}

export default function FeaturedDeals({ deals }: FeaturedDealsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (deals.length === 0) return null;

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const { scrollLeft, clientWidth } = scrollRef.current;
        const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
        scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    };

    return (
        <section className="relative py-8">
            <div className="mb-6 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-inner">
                        <Flame className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-foreground">Hot Deals</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Top offers from premium businesses</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground transition-all hover:bg-background hover:text-foreground active:scale-90"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground transition-all hover:bg-background hover:text-foreground active:scale-90"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex items-stretch gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x"
            >
                {deals.map((deal) => (
                    <div key={deal.id} className="w-[350px] flex-shrink-0 snap-start">
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
                    </div>
                ))}
            </div>
        </section>
    );
}
