"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

interface ActiveFiltersDisplayProps {
    q: string;
    category: string;
    barangay: string[];
    openNow: boolean;
    featuredOnly: boolean;
    categoryName?: string;
    onRemoveQ: () => void;
    onRemoveCategory: () => void;
    onRemoveBarangay: (slug: string) => void;
    onRemoveOpenNow: () => void;
    onRemoveFeaturedOnly: () => void;
    onClearAll: () => void;
    className?: string;
}

export default function SearchActiveFilters({
    q,
    category,
    barangay,
    openNow,
    featuredOnly,
    categoryName,
    onRemoveQ,
    onRemoveCategory,
    onRemoveBarangay,
    onRemoveOpenNow,
    onRemoveFeaturedOnly,
    onClearAll,
    className,
}: ActiveFiltersDisplayProps) {
    const hasFilters = !!q || !!category || barangay.length > 0 || openNow || featuredOnly;
    if (!hasFilters) return null;

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {q && (
                <Chip label={`"${q}"`} icon={<Search className="h-3 w-3" />} onRemove={onRemoveQ} />
            )}
            {category && (
                <Chip label={categoryName || category} onRemove={onRemoveCategory} />
            )}
            {barangay.map((slug) => (
                <Chip key={slug} label={slug} onRemove={() => onRemoveBarangay(slug)} />
            ))}
            {openNow && (
                <Chip label="Open Now" onRemove={onRemoveOpenNow} variant="green" />
            )}
            {featuredOnly && (
                <Chip label="Featured Only" onRemove={onRemoveFeaturedOnly} variant="amber" />
            )}
            <button
                onClick={onClearAll}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
                Clear all
            </button>
        </div>
    );
}

function Chip({
    label,
    icon,
    onRemove,
    variant = "default",
}: {
    label: string;
    icon?: React.ReactNode;
    onRemove: () => void;
    variant?: "default" | "green" | "amber";
}) {
    const styles = {
        default: "bg-secondary/10 text-secondary hover:bg-secondary/20",
        green: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400",
    }[variant];

    return (
        <button
            onClick={onRemove}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                styles
            )}
        >
            {icon}
            {label}
            <X className="h-3 w-3" />
        </button>
    );
}
