"use client";

import { useState, useEffect } from "react";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import SearchBar from "@/components/shared/SearchBar";
import SearchFilterBar from "./SearchFilterBar";
import SearchActiveFilters from "./SearchActiveFilters";
import SearchResultsHeader from "./SearchResultsHeader";
import NoResults from "./NoResults";
import SplitMapView, { type MapListing } from "./SplitMapView";
import ListingGrid from "@/components/public/ListingGrid";
import ListingList from "@/components/public/ListingList";
import Pagination from "@/components/shared/Pagination";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListingItem = any;

interface SearchPageProps {
    listings: ListingItem[];
    total: number;
    categories: Category[];
    barangays: Barangay[];
    currentPage: number;
    totalPages: number;
    initialQ: string;
}

export default function SearchPage({
    listings,
    total,
    categories,
    barangays,
    currentPage,
    totalPages,
    initialQ,
}: SearchPageProps) {
    const {
        filters,
        setQ,
        setCategory,
        toggleBarangay,
        setSort,
        setOpenNow,
        setFeaturedOnly,
        setPage,
        setView,
        clearAll,
    } = useSearchFilters();

    const [localListings, setLocalListings] = useState(listings);
    const [localTotal, setLocalTotal] = useState(total);

    // Sync with props when navigation-based search happens
    useEffect(() => {
        setLocalListings(listings);
        setLocalTotal(total);
    }, [listings, total]);

    const handleResultsUpdate = (newListings: any[], newTotal: number) => {
        // Normalize results to ensure image_url is present for components
        const normalized = newListings.map((l) => ({
            ...l,
            image_url: l.image_url || l.listing_images?.[0]?.image_url || null,
        }));
        setLocalListings(normalized);
        setLocalTotal(newTotal);
    };

    const activeCategoryObj = categories.find((c) => c.slug === filters.category);

    // Build map pins from listings
    const mapListings: MapListing[] = localListings.map((l) => ({
        id: l.id,
        slug: l.slug,
        business_name: l.business_name,
        lat: l.lat ?? null,
        lng: l.lng ?? null,
        is_featured: l.is_featured ?? false,
        is_premium: l.is_premium ?? false,
        isSponsored: l.isSponsored ?? false,
        image_url: l.image_url ?? l.listing_images?.[0]?.image_url ?? null,
        categories: Array.isArray(l.categories) ? l.categories[0] : l.categories,
    }));

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Top search bar */}
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 sm:p-8">
                <SearchBar
                    categories={categories}
                    barangays={barangays.map((b) => ({ name: b.name, slug: b.slug }))}
                    variant="hero"
                />
            </div>

            {/* Filter bar */}
            <SearchFilterBar
                categories={categories}
                barangays={barangays}
                activeCategory={filters.category}
                activeBarangays={filters.barangay}
                openNow={filters.openNow}
                featuredOnly={filters.featuredOnly}
                sort={filters.sort}
                view={filters.view}
                onCategoryChange={setCategory}
                onBarangayToggle={toggleBarangay}
                onOpenNowToggle={() => setOpenNow(!filters.openNow)}
                onFeaturedOnlyToggle={() => setFeaturedOnly(!filters.featuredOnly)}
                onSortChange={setSort}
                onViewChange={setView}
                onClearAll={clearAll}
                className="mb-3"
            />

            {/* Active filter chips */}
            <SearchActiveFilters
                q={filters.q}
                category={filters.category}
                barangay={filters.barangay}
                openNow={filters.openNow}
                featuredOnly={filters.featuredOnly}
                categoryName={activeCategoryObj?.name}
                onRemoveQ={() => setQ("")}
                onRemoveCategory={() => setCategory("")}
                onRemoveBarangay={(slug) => toggleBarangay(slug)}
                onRemoveOpenNow={() => setOpenNow(false)}
                onRemoveFeaturedOnly={() => setFeaturedOnly(false)}
                onClearAll={clearAll}
                className="mb-4"
            />

            {/* Results header */}
            <SearchResultsHeader
                query={filters.q}
                total={localTotal}
                className="mb-4"
            />

            {/* Results area */}
            {localListings.length === 0 && filters.view !== "map" ? (
                <NoResults
                    query={filters.q}
                    popularCategories={categories}
                    onClearFilters={clearAll}
                />
            ) : filters.view === "map" ? (
                <SplitMapView
                    listings={mapListings}
                    onResultsUpdate={handleResultsUpdate}
                    className="mt-2"
                />
            ) : filters.view === "list" ? (
                <ListingList
                    listings={localListings}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/olongapo/search"
                />
            ) : (
                <ListingGrid
                    listings={localListings}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/olongapo/search"
                />
            )}
        </div>
    );
}
