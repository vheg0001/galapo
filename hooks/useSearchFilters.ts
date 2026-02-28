"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type SortValue = "featured" | "newest" | "name_asc" | "name_desc";
export type ViewMode = "grid" | "list" | "map";

export interface SearchFilters {
    q: string;
    category: string;
    barangay: string[]; // comma-separated slugs
    sort: SortValue;
    openNow: boolean;
    featuredOnly: boolean;
    page: number;
    view: ViewMode;
}

export interface UseSearchFiltersReturn {
    filters: SearchFilters;
    setQ: (q: string) => void;
    setCategory: (category: string) => void;
    toggleBarangay: (slug: string) => void;
    setSort: (sort: SortValue) => void;
    setOpenNow: (value: boolean) => void;
    setFeaturedOnly: (value: boolean) => void;
    setPage: (page: number) => void;
    setView: (view: ViewMode) => void;
    clearAll: () => void;
    applyFilters: (partial: Partial<SearchFilters>) => void;
}

export function useSearchFilters(): UseSearchFiltersReturn {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filters = useMemo((): SearchFilters => {
        const barangayRaw = searchParams.get("barangay") || "";
        const sortRaw = searchParams.get("sort") || "featured";
        const validSorts: SortValue[] = ["featured", "newest", "name_asc", "name_desc"];
        const validViews: ViewMode[] = ["grid", "list", "map"];

        return {
            q: searchParams.get("q") || "",
            category: searchParams.get("category") || "",
            barangay: barangayRaw ? barangayRaw.split(",").filter(Boolean) : [],
            sort: validSorts.includes(sortRaw as SortValue) ? (sortRaw as SortValue) : "featured",
            openNow: searchParams.get("open_now") === "true",
            featuredOnly: searchParams.get("featured_only") === "true",
            page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
            view: validViews.includes(searchParams.get("view") as ViewMode)
                ? (searchParams.get("view") as ViewMode)
                : "grid",
        };
    }, [searchParams]);

    const push = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString());
            // Reset page when any filter changes (unless page itself is being set)
            if (!("page" in updates)) params.delete("page");

            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "") {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            });

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const setQ = useCallback((q: string) => push({ q: q || null }), [push]);
    const setCategory = useCallback((category: string) => push({ category: category || null }), [push]);
    const setSort = useCallback((sort: SortValue) => push({ sort: sort === "featured" ? null : sort }), [push]);
    const setOpenNow = useCallback((value: boolean) => push({ open_now: value ? "true" : null }), [push]);
    const setFeaturedOnly = useCallback((value: boolean) => push({ featured_only: value ? "true" : null }), [push]);
    const setPage = useCallback((page: number) => push({ page: page > 1 ? String(page) : null }), [push]);
    const setView = useCallback((view: ViewMode) => push({ view: view === "grid" ? null : view }), [push]);

    const toggleBarangay = useCallback(
        (slug: string) => {
            const next = filters.barangay.includes(slug)
                ? filters.barangay.filter((b) => b !== slug)
                : [...filters.barangay, slug];
            push({ barangay: next.length > 0 ? next.join(",") : null });
        },
        [filters.barangay, push]
    );

    const clearAll = useCallback(() => {
        router.push(pathname, { scroll: false });
    }, [router, pathname]);

    const applyFilters = useCallback(
        (partial: Partial<SearchFilters>) => {
            const updates: Record<string, string | null> = {};
            if ("q" in partial) updates.q = partial.q || null;
            if ("category" in partial) updates.category = partial.category || null;
            if ("barangay" in partial) updates.barangay = partial.barangay?.join(",") || null;
            if ("sort" in partial) updates.sort = partial.sort === "featured" ? null : partial.sort || null;
            if ("openNow" in partial) updates.open_now = partial.openNow ? "true" : null;
            if ("featuredOnly" in partial) updates.featured_only = partial.featuredOnly ? "true" : null;
            if ("page" in partial) updates.page = partial.page && partial.page > 1 ? String(partial.page) : null;
            if ("view" in partial) updates.view = partial.view === "grid" ? null : partial.view || null;
            push(updates);
        },
        [push]
    );

    return {
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
        applyFilters,
    };
}
