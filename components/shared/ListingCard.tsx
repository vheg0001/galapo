"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import LazyImage from "./LazyImage";
import { MapPin, Phone } from "lucide-react";
import Badge from "./Badge";
import BadgeDisplay from "./BadgeDisplay";
import { truncateText } from "@/lib/utils";
import { ListingBadge } from "@/lib/types";
import { getCardBadges } from "@/lib/badge-utils";

interface ListingCardProps {
    id: string;
    slug: string;
    businessName: string;
    shortDescription: string;
    categoryName?: string;
    subcategoryName?: string;
    barangayName?: string;
    phone?: string | null;
    logoUrl?: string | null;
    imageUrl?: string | null;
    isFeatured?: boolean;
    isPremium?: boolean;
    isNew?: boolean;
    priority?: boolean;
    badges?: ListingBadge[];
    layout?: "grid" | "list";
}

export default function ListingCard({
    id,
    slug,
    businessName,
    shortDescription,
    categoryName,
    subcategoryName,
    barangayName,
    phone,
    logoUrl,
    imageUrl,
    isPremium,
    isFeatured,
    isNew,
    priority,
    badges = [],
    layout = "grid",
}: ListingCardProps) {
    // We prioritize the primary gallery image (imageUrl) over the logo for the main cover,
    // as users usually want the "Cover" they set in the gallery to be the main visual.
    const displayImage = imageUrl || logoUrl || "/placeholder-business.svg";

    const cardBadges = getCardBadges(badges, isPremium, isFeatured);
    const planBadges = cardBadges.filter(lb => lb.badge?.type === "plan");
    const adminBadges = cardBadges.filter(lb => lb.badge?.type !== "plan");

    const hasPlanBadges = planBadges.length > 0 || isPremium || isFeatured;
    const hasAdminBadges = adminBadges.length > 0;

    return (
        <Link
            href={`/olongapo/${slug}`}
            className={cn(
                "group flex overflow-hidden rounded-xl border transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-2 h-full",
                layout === "grid" ? "flex-col" : "flex-col sm:flex-row",
                isPremium 
                  ? "premium-card-border bg-card relative shadow-[0_0_30px_rgba(255,215,0,0.15)] hover:shadow-[0_0_40px_rgba(255,215,0,0.25)]" 
                  : "border-border bg-card"
            )}
        >
            {/* Premium Moving Shimmer Background */}
            {isPremium && (
                <div className="absolute inset-0 pointer-events-none opacity-20 animate-premium-shimmer" />
            )}

            {/* Image */}
            <div className={cn(
                "relative aspect-[16/10] overflow-hidden bg-muted flex-shrink-0",
                layout === "grid" ? "w-full" : "w-full sm:w-48 md:w-56"
            )}>
                <LazyImage
                    src={displayImage}
                    alt={businessName}
                    className={cn(
                        "object-cover transition-transform duration-700 group-hover:scale-110",
                        isPremium && "animate-pulse-subtle"
                    )}
                    priority={priority}
                />
                
                {/* Periodic Glint Effect for Premium */}
                {isPremium && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-glint" />
                    </div>
                )}

                {/* Overlay badges — plan badges only */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    {hasPlanBadges && (
                        <BadgeDisplay
                            badges={planBadges}
                            mode="card"
                            size="sm"
                            isPremium={isPremium}
                            isFeatured={isFeatured}
                        />
                    )}
                    {/* "New" is a UI freshness indicator only — not a stored badge */}
                    {isNew && <Badge variant="new">New</Badge>}
                </div>
            </div>

            {/* Content */}
            <div className={cn("flex flex-1 flex-col p-4 relative z-10", isPremium && "pb-6")}>
                {/* Premium Glow Accent */}
                {isPremium && (
                    <div className="absolute -top-4 -right-4 h-24 w-24 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-400/20 transition-colors duration-500" />
                )}

                <h3 className={cn(
                    "text-base font-bold text-foreground line-clamp-1 transition-colors duration-300",
                    isPremium ? "text-amber-950 dark:text-amber-50 group-hover:text-amber-600" : "group-hover:text-secondary"
                )} title={businessName}>
                    {businessName}
                </h3>

                {/* Badges moved below title — admin badges only */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 min-h-[1.75rem]">
                    {hasAdminBadges && (
                        <BadgeDisplay
                            badges={adminBadges}
                            mode="card"
                            size="sm"
                        />
                    )}
                </div>

                <div className="flex flex-col min-h-[3.25rem] justify-center">
                    {(subcategoryName || categoryName) && (
                        <span className={cn(
                            "mt-1 text-xs font-bold uppercase tracking-wider",
                            isPremium ? "text-amber-600/80" : "text-secondary"
                        )}>{subcategoryName || categoryName}</span>
                    )}

                    {barangayName && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{barangayName}</span>
                        </div>
                    )}
                </div>

                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {truncateText(shortDescription, 90)}
                </p>

                <div className="mt-auto pt-4 border-t border-border/30 min-h-[3.5rem] flex items-center">
                    {phone && (
                        <span
                            className={cn(
                                "inline-flex items-center gap-2 text-sm font-bold transition-all duration-300 transform group-hover:translate-x-1",
                                isPremium ? "text-amber-700 hover:text-amber-600" : "text-primary hover:text-secondary"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `tel:${phone}`;
                            }}
                        >
                            <Phone className="h-3.5 w-3.5" />
                            {phone}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Premium Golden Bottom Line - Absolutely positioned so it doesn't break flex layout in List view */}
            {isPremium && (
                <div className="absolute bottom-0 left-0 h-1.5 w-full premium-gold-gradient opacity-80 group-hover:opacity-100 transition-opacity z-20" />
            )}
        </Link>
    );
}
