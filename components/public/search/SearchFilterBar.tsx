"use client";

import { Search, LayoutGrid, List, Map, SlidersHorizontal, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SortValue, type ViewMode } from "@/hooks/useSearchFilters";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface Barangay {
    id: string;
    name: string;
    slug: string;
}

interface SearchFilterBarProps {
    categories: Category[];
    barangays: Barangay[];
    activeCategory: string;
    activeBarangays: string[];
    openNow: boolean;
    featuredOnly: boolean;
    sort: SortValue;
    view: ViewMode;
    onCategoryChange: (slug: string) => void;
    onBarangayToggle: (slug: string) => void;
    onOpenNowToggle: () => void;
    onFeaturedOnlyToggle: () => void;
    onSortChange: (sort: SortValue) => void;
    onViewChange: (view: ViewMode) => void;
    onClearAll: () => void;
    className?: string;
}

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
    { value: "featured", label: "Most Relevant" },
    { value: "newest", label: "Newest" },
    { value: "name_asc", label: "Name A–Z" },
    { value: "name_desc", label: "Name Z–A" },
];

const VIEW_OPTIONS: { mode: ViewMode; Icon: React.ElementType; label: string }[] = [
    { mode: "grid", Icon: LayoutGrid, label: "Grid" },
    { mode: "list", Icon: List, label: "List" },
    { mode: "map", Icon: Map, label: "Map" },
];

export default function SearchFilterBar({
    categories,
    barangays,
    activeCategory,
    activeBarangays,
    openNow,
    featuredOnly,
    sort,
    view,
    onCategoryChange,
    onBarangayToggle,
    onOpenNowToggle,
    onFeaturedOnlyToggle,
    onSortChange,
    onViewChange,
    onClearAll,
    className,
}: SearchFilterBarProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                {/* Category dropdown */}
                <div className="relative">
                    <select
                        value={activeCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* Barangay dropdown */}
                <div className="relative">
                    <select
                        value=""
                        onChange={(e) => { if (e.target.value) onBarangayToggle(e.target.value); }}
                        className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
                    >
                        <option value="">
                            {activeBarangays.length > 0
                                ? `Barangay (${activeBarangays.length})`
                                : "All Barangays"}
                        </option>
                        {barangays.map((b) => (
                            <option key={b.id} value={b.slug}>
                                {activeBarangays.includes(b.slug) ? "✓ " : "  "}
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Open Now toggle */}
                <button
                    onClick={onOpenNowToggle}
                    className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
                        openNow
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "border-border bg-card text-muted-foreground hover:border-secondary/40 hover:text-foreground"
                    )}
                >
                    <Zap className="h-3.5 w-3.5" />
                    Open Now
                </button>

                {/* Featured Only toggle */}
                <button
                    onClick={onFeaturedOnlyToggle}
                    className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
                        featuredOnly
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                            : "border-border bg-card text-muted-foreground hover:border-secondary/40 hover:text-foreground"
                    )}
                >
                    <Star className="h-3.5 w-3.5" />
                    Featured
                </button>

                {/* Sort */}
                <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={sort}
                        onChange={(e) => onSortChange(e.target.value as SortValue)}
                        className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* View toggle */}
                <div className="ml-auto inline-flex rounded-lg border border-border bg-card p-0.5">
                    {VIEW_OPTIONS.map(({ mode, Icon, label }) => (
                        <button
                            key={mode}
                            onClick={() => onViewChange(mode)}
                            aria-label={label}
                            title={label}
                            className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                                view === mode
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    ))}
                </div>

                {/* Clear all */}
                <button
                    onClick={onClearAll}
                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
}
