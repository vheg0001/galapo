import type { BlogLinkedListing } from "@/lib/types";
import LinkedListingCard from "@/components/public/blog/LinkedListingCard";

interface LinkedListingsSectionProps {
    listings: BlogLinkedListing[];
}

export default function LinkedListingsSection({ listings }: LinkedListingsSectionProps) {
    if (listings.length === 0) return null;

    return (
        <section className="space-y-5">
            <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">Businesses Mentioned in This Article</h2>
                <p className="mt-1 text-sm text-muted-foreground">Explore the local places referenced in this story.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {listings.map((listing) => (
                    <LinkedListingCard key={listing.id} listing={listing} />
                ))}
            </div>
        </section>
    );
}