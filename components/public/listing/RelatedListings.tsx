import ListingCard from "@/components/shared/ListingCard";

interface RelatedListing {
    id: string;
    slug: string;
    business_name: string;
    short_description: string;
    phone?: string | null;
    logo_url?: string | null;
    is_featured: boolean;
    is_premium: boolean;
    categories: { name: string; slug: string } | null;
    barangays: { name: string; slug: string } | null;
    listing_images: { image_url: string; is_primary: boolean }[];
}

interface RelatedListingsProps {
    listings: RelatedListing[];
    categoryName?: string;
}

export default function RelatedListings({ listings, categoryName }: RelatedListingsProps) {
    if (!listings || listings.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-foreground">
                    Similar Businesses in Olongapo
                </h2>
                {categoryName && (
                    <span className="text-sm text-muted-foreground">
                        in {categoryName}
                    </span>
                )}
            </div>

            {/* Grid: 2 cols on mobile (horizontal scroll), 4 cols on desktop */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 overflow-x-auto">
                {listings.map((listing, i) => {
                    const primaryImage = listing.listing_images?.find((img) => img.is_primary)?.image_url
                        || listing.listing_images?.[0]?.image_url;

                    return (
                        <ListingCard
                            key={listing.id}
                            id={listing.id}
                            slug={listing.slug}
                            businessName={listing.business_name}
                            shortDescription={listing.short_description}
                            categoryName={listing.categories?.name}
                            barangayName={listing.barangays?.name}
                            phone={listing.phone}
                            logoUrl={listing.logo_url}
                            imageUrl={primaryImage}
                            isFeatured={listing.is_featured}
                            isPremium={listing.is_premium}
                        />
                    );
                })}
            </div>
        </section>
    );
}
