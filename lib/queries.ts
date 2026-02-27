// ──────────────────────────────────────────────────────────
// GalaPo — Reusable Supabase Queries
// ──────────────────────────────────────────────────────────

import { SupabaseClient } from "@supabase/supabase-js";

interface ListingFilters {
    isFeatured?: boolean;
    isActive?: boolean;
    status?: "pending" | "approved" | "rejected";
    limit?: number;
    categoryId?: string;
    barangayId?: string;
    searchQuery?: string;
}

/**
 * Reusable query builder for fetching listings with common joins and filters.
 */
export function getListingsQuery(supabase: SupabaseClient, filters: ListingFilters = {}) {
    let query = supabase.from("listings").select(`
        id, 
        slug, 
        business_name, 
        short_description, 
        phone, 
        logo_url, 
        image_url,
        is_featured, 
        is_premium,
        created_at,
        categories!listings_category_id_fkey ( name, slug ),
        barangays ( name, slug )
    `);

    // Default filters for public visibility
    const isActive = filters.isActive !== undefined ? filters.isActive : true;
    const status = filters.status || "approved";

    query = query.eq("is_active", isActive).eq("status", status);

    if (filters.isFeatured) {
        query = query.eq("is_featured", true);
    }

    if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
    }

    if (filters.barangayId) {
        query = query.eq("barangay_id", filters.barangayId);
    }

    if (filters.searchQuery) {
        // Simple case-insensitive search on business name or description
        query = query.or(`business_name.ilike.%${filters.searchQuery}%,short_description.ilike.%${filters.searchQuery}%`);
    }

    // Default limit
    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    return query;
}

/**
 * Reusable query to fetch active categories along with listing counts.
 * Note: Listing counts usually require either a database function or client-side aggregation
 * if doing it purely via REST. Here we'll rely on the dedicated API endpoint logic.
 */
export function getActiveCategories(supabase: SupabaseClient, parentOnly = false) {
    let query = supabase
        .from("categories")
        .select("id, name, slug, icon, parent_id, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (parentOnly) {
        query = query.is("parent_id", null);
    }

    return query;
}

/**
 * Reusable query to fetch an active ad for a specific location.
 */
export function getActiveAdsForLocation(supabase: SupabaseClient, location: string, position: number = 1) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    return supabase
        .from("ad_placements")
        .select("*")
        .eq("placement_location", location)
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        // Use range to pick the specific ad based on position index (0-indexed)
        .range(position - 1, position - 1)
        .maybeSingle();
}
