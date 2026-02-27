"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import CategorySidebar from "@/components/public/CategorySidebar";
import FilterDrawer from "@/components/public/FilterDrawer";
import ViewToggle, { type ViewMode } from "@/components/public/ViewToggle";
import SortDropdown, { type SortOption } from "@/components/public/SortDropdown";
import ResultsCount from "@/components/public/ResultsCount";
import ActiveFilters from "@/components/public/ActiveFilters";
import ListingGrid from "@/components/public/ListingGrid";
import ListingList from "@/components/public/ListingList";
import ListingMapView from "@/components/public/ListingMapView";
import type { ListingItem } from "@/components/public/ListingGrid";

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

interface CategoryDetailClientProps {
    variant: "sidebar" | "main";
    categoryName: string;
    subcategories: Subcategory[];
    barangayGroups: BarangayGroup[];
    showSubcategoryFilter?: boolean;
    listings?: ListingItem[];
    currentPage?: number;
    totalPages?: number;
    total?: number;
    basePath?: string;
    currentSort?: SortOption;
    barangayCounts?: Record<string, number>;
}

export default function CategoryDetailClient({
    variant,
    categoryName,
    subcategories,
    barangayGroups,
    showSubcategoryFilter = true,
    listings = [],
    currentPage = 1,
    totalPages = 1,
    total = 0,
    basePath = "",
    currentSort = "featured",
    barangayCounts = {},
}: CategoryDetailClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Sidebar-only render
    if (variant === "sidebar") {
        return (
            <CategorySidebar
                categoryName={categoryName}
                subcategories={subcategories}
                barangayGroups={barangayGroups}
                barangayCounts={barangayCounts}
                showSubcategoryFilter={showSubcategoryFilter}
            />
        );
    }

    // Build active filter chips
    const activeFilters: { key: string; label: string; value: string }[] = [];
    const activeSub = searchParams.get("sub");
    if (activeSub) {
        const sub = subcategories.find((s) => s.slug === activeSub);
        if (sub) activeFilters.push({ key: "sub", label: sub.name, value: activeSub });
    }
    const activeBarangays = searchParams.getAll("barangay");
    activeBarangays.forEach((b) => {
        const brgy = barangayGroups.flatMap((g) => g.items).find((item) => item.slug === b);
        activeFilters.push({ key: "barangay", label: brgy?.name || b, value: b });
    });
    if (searchParams.get("featured") === "true") {
        activeFilters.push({ key: "featured", label: "Featured Only", value: "true" });
    }
    if (searchParams.get("open_now") === "true") {
        activeFilters.push({ key: "open_now", label: "Open Now", value: "true" });
    }

    const handleSortChange = (sort: SortOption) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        if (sort === "featured") {
            params.delete("sort");
        } else {
            params.set("sort", sort);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRemoveFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        if (key === "barangay") {
            const all = params.getAll("barangay").filter((v) => v !== value);
            params.delete("barangay");
            all.forEach((v) => params.append("barangay", v));
        } else {
            params.delete(key);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleClearAll = () => {
        router.push(pathname);
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Mobile filter button */}
                    <FilterDrawer
                        categoryName={categoryName}
                        subcategories={subcategories}
                        barangayGroups={barangayGroups}
                        barangayCounts={barangayCounts}
                        showSubcategoryFilter={showSubcategoryFilter}
                        activeFilterCount={activeFilters.length}
                    />
                    <ResultsCount showing={listings.length} total={total} />
                </div>
                <div className="flex items-center gap-3">
                    <SortDropdown current={currentSort} onChange={handleSortChange} />
                    <ViewToggle current={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Active Filters */}
            <ActiveFilters
                filters={activeFilters}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearAll}
                className="mb-4"
            />

            {/* View */}
            {viewMode === "grid" && (
                <ListingGrid
                    listings={listings}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath={basePath}
                />
            )}
            {viewMode === "list" && (
                <ListingList
                    listings={listings}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath={basePath}
                />
            )}
            {viewMode === "map" && (
                <ListingMapView listings={listings} />
            )}
        </div>
    );
}
