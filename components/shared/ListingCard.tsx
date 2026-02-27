import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import Badge from "./Badge";
import { truncateText } from "@/lib/utils";

interface ListingCardProps {
    id: string;
    slug: string;
    businessName: string;
    shortDescription: string;
    categoryName?: string;
    barangayName?: string;
    phone?: string | null;
    logoUrl?: string | null;
    imageUrl?: string | null;
    isFeatured?: boolean;
    isPremium?: boolean;
    isNew?: boolean;
}

export default function ListingCard({
    slug,
    businessName,
    shortDescription,
    categoryName,
    barangayName,
    phone,
    logoUrl,
    imageUrl,
    isFeatured,
    isPremium,
    isNew,
}: ListingCardProps) {
    const displayImage = imageUrl || logoUrl || "/placeholder-business.svg";

    return (
        <Link
            href={`/listing/${slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
        >
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <Image
                    src={displayImage}
                    alt={businessName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Badges */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    {isFeatured && <Badge variant="featured">Featured</Badge>}
                    {isPremium && <Badge variant="premium">Premium</Badge>}
                    {isNew && <Badge variant="new">New</Badge>}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
                    {businessName}
                </h3>

                {categoryName && (
                    <span className="mt-1 text-xs font-medium text-secondary">{categoryName}</span>
                )}

                {barangayName && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{barangayName}</span>
                    </div>
                )}

                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {truncateText(shortDescription, 100)}
                </p>

                {phone && (
                    <div className="mt-auto pt-3 border-t border-border/50">
                        <span
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-secondary transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `tel:${phone}`;
                            }}
                        >
                            <Phone className="h-3.5 w-3.5" />
                            {phone}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}
