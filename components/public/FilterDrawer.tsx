"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import CategorySidebar from "./CategorySidebar";

interface FilterDrawerProps {
    categoryName: string;
    subcategories?: { id: string; name: string; slug: string; listingCount: number }[];
    barangayGroups: { header: string; items: { id: string; name: string; slug: string }[] }[];
    showSubcategoryFilter?: boolean;
    barangayCounts?: Record<string, number>;
    activeFilterCount?: number;
}

export default function FilterDrawer({
    categoryName,
    subcategories,
    barangayGroups,
    barangayCounts = {},
    showSubcategoryFilter = true,
    activeFilterCount = 0,
}: FilterDrawerProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Trigger Button — mobile only */}
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent lg:hidden"
            >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Overlay */}
            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl animate-in slide-in-from-bottom duration-300">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
                                aria-label="Close filters"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <CategorySidebar
                            categoryName={categoryName}
                            subcategories={subcategories}
                            barangayGroups={barangayGroups}
                            barangayCounts={barangayCounts}
                            showSubcategoryFilter={showSubcategoryFilter}
                        />

                        <button
                            onClick={() => setOpen(false)}
                            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Show Results
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
