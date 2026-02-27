"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Subcategory {
    id: string;
    name: string;
    slug: string;
    listingCount: number;
}

interface BarangayGroup {
    header: string;
    items: { id: string; name: string; slug: string }[];
}

interface CategorySidebarProps {
    categoryName: string;
    subcategories?: Subcategory[];
    barangayGroups: BarangayGroup[];
    showSubcategoryFilter?: boolean;
    barangayCounts?: Record<string, number>;
    className?: string;
}

export default function CategorySidebar({
    categoryName,
    subcategories = [],
    barangayGroups,
    barangayCounts = {},
    showSubcategoryFilter = true,
    className,
}: CategorySidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeSubcategory = searchParams.get("sub") || "";
    const activeBarangays = searchParams.getAll("barangay");
    const openNow = searchParams.get("open_now") === "true";
    const featuredOnly = searchParams.get("featured") === "true";

    const updateParams = useCallback(
        (updates: Record<string, string | string[] | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            // Reset page on filter change
            params.delete("page");

            Object.entries(updates).forEach(([key, value]) => {
                params.delete(key);
                if (value === null) return;
                if (Array.isArray(value)) {
                    value.forEach((v) => params.append(key, v));
                } else {
                    params.set(key, value);
                }
            });

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const handleSubcategoryClick = (slug: string) => {
        updateParams({ sub: slug === activeSubcategory ? null : slug });
    };

    const handleBarangayToggle = (slug: string) => {
        const next = activeBarangays.includes(slug)
            ? activeBarangays.filter((b) => b !== slug)
            : [...activeBarangays, slug];
        updateParams({ barangay: next.length > 0 ? next : null });
    };

    const handleClearAll = () => {
        router.push(pathname, { scroll: false });
    };

    return (
        <aside className={cn("space-y-6", className)}>
            {/* Subcategory Filter */}
            {showSubcategoryFilter && subcategories.length > 0 && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                        Subcategories
                    </h4>
                    <ul className="space-y-1">
                        <li>
                            <button
                                onClick={() => updateParams({ sub: null })}
                                className={cn(
                                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                                    !activeSubcategory
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                All {categoryName}
                            </button>
                        </li>
                        {subcategories.map((sub) => (
                            <li key={sub.id}>
                                <button
                                    onClick={() => handleSubcategoryClick(sub.slug)}
                                    className={cn(
                                        "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                                        activeSubcategory === sub.slug
                                            ? "bg-primary/10 font-medium text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <span>{sub.name}</span>
                                    <span className="text-xs text-muted-foreground/70">{sub.listingCount}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Barangay Filter */}
            <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wider">
                    Location
                </h4>
                {barangayGroups.map((group) => {
                    const filteredItems = group.items.map(b => ({
                        ...b,
                        count: barangayCounts[b.id] || 0
                    })).filter(b => b.count > 0 || activeBarangays.includes(b.slug));

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={group.header} className="mb-3">
                            <p className="mb-1.5 text-xs font-medium text-muted-foreground/70">{group.header}</p>
                            <ul className="space-y-0.5">
                                {filteredItems.map((b) => (
                                    <li key={b.id}>
                                        <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={activeBarangays.includes(b.slug)}
                                                    onChange={() => handleBarangayToggle(b.slug)}
                                                    className="h-3.5 w-3.5 rounded border-border text-primary accent-primary"
                                                />
                                                {b.name}
                                            </div>
                                            <span className="text-xs text-muted-foreground/70">{b.count}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <span className="text-sm text-foreground">Open Now</span>
                    <input
                        type="checkbox"
                        checked={openNow}
                        onChange={() => updateParams({ open_now: openNow ? null : "true" })}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                    />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <span className="text-sm text-foreground">Featured Only</span>
                    <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={() => updateParams({ featured: featuredOnly ? null : "true" })}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                    />
                </label>
            </div>

            {/* Clear All */}
            <button
                onClick={handleClearAll}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
                Clear all filters
            </button>
        </aside>
    );
}
