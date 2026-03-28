"use client";

import { ListingBadge } from "@/lib/types";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import BadgeChip from "./BadgeChip";
import { getCardBadges, getSortedBadges } from "@/lib/badge-utils";
import Badge from "./Badge";

interface BadgeDisplayProps {
    badges: ListingBadge[];
    /**
     * "card"   — enforces the card rules: max 2 badges, plan badge first then
     *            top admin badge. The maxDisplay prop is ignored in this mode.
     * "detail" — shows all active badges sorted by priority; +N expand button
     *            appears when more than maxDisplay badges are present.
     */
    mode?: "card" | "detail";
    maxDisplay?: number;
    size?: "sm" | "md" | "lg";
    className?: string;
    isPremium?: boolean;
    isFeatured?: boolean;
}

export default function BadgeDisplay({
    badges,
    mode = "detail",
    maxDisplay = 5,
    size = "md",
    className,
    isPremium,
    isFeatured,
}: BadgeDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderBadgeNode = (lb: ListingBadge, showTooltip = false) => {
        if (lb.badge?.type === "plan") {
            const variant = lb.badge.slug === "premium" ? "premium" : "featured";
            return (
                <Badge key={lb.id} variant={variant}>
                    {lb.badge.name}
                </Badge>
            );
        }

        return (
            <BadgeChip
                key={lb.id}
                badge={lb.badge}
                size={size}
                showTooltip={showTooltip}
            />
        );
    };

    if ((!badges || badges.length === 0) && !isPremium && !isFeatured) return null;

    // ── Card mode: max 2 badges (plan badge first, then top admin/system badge) ──
    if (mode === "card") {
        const cardBadges = getCardBadges(badges, isPremium, isFeatured);

        let displayItems: React.ReactNode[] = cardBadges.map((lb) => renderBadgeNode(lb));

        const hasPlanBadgeInDb = cardBadges.some(lb => lb.badge?.type === "plan");
        if (!hasPlanBadgeInDb) {
            if (isPremium) {
                displayItems.unshift(<Badge key="legacy-premium" variant="premium">Premium</Badge>);
            } else if (isFeatured) {
                displayItems.unshift(<Badge key="legacy-featured" variant="featured">Featured</Badge>);
            }
        }

        if (displayItems.length === 0) return null;

        return (
            <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
                {displayItems}
            </div>
        );
    }

    // ── Detail mode: all badges with optional expand ──
    const sortedBadges = getSortedBadges(badges);

    const allItems: React.ReactNode[] = sortedBadges.map((lb) => renderBadgeNode(lb, true));

    const hasPlanBadgeInDb = sortedBadges.some(lb => lb.badge?.type === "plan");
    if (!hasPlanBadgeInDb) {
        if (isPremium) {
            allItems.unshift(<Badge key="legacy-premium" variant="premium">Premium</Badge>);
        } else if (isFeatured) {
            allItems.unshift(<Badge key="legacy-featured" variant="featured">Featured</Badge>);
        }
    }

    if (allItems.length === 0) return null;

    const displayCount = isExpanded ? allItems.length : maxDisplay;
    const itemsToShow = allItems.slice(0, displayCount);
    const remainingCount = allItems.length - maxDisplay;

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {itemsToShow}

            {!isExpanded && remainingCount > 0 && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsExpanded(true);
                    }}
                    className={cn(
                        "inline-flex items-center rounded-full bg-muted font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
                    )}
                >
                    +{remainingCount} more
                </button>
            )}
        </div>
    );
}
