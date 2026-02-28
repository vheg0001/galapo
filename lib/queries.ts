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

// ──────────────────────────────────────────────────────────
// Category Browsing Queries
// ──────────────────────────────────────────────────────────

/**
 * Fetch a category by slug with its subcategories.
 */
export async function getCategoryBySlug(supabase: SupabaseClient, slug: string) {
    const { data: category } = await supabase
        .from("categories")
        .select("id, name, slug, icon, parent_id, description")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

    if (!category) return null;

    // Fetch subcategories if this is a parent
    const { data: subcategories } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("parent_id", category.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    return { ...category, subcategories: subcategories || [] };
}

export type CategorySort = "featured" | "newest" | "name_asc" | "name_desc";

interface CategoryListingFilters {
    categoryId: string;
    subcategoryId?: string;
    barangaySlugs?: string[];
    featuredOnly?: boolean;
    sort?: CategorySort;
    page?: number;
    perPage?: number;
    searchQuery?: string;
}

/**
 * Fetch paginated listings for a category/subcategory with filters and sorting.
 * Returns { listings, total }.
 */
export async function getCategoryListings(supabase: SupabaseClient, filters: CategoryListingFilters) {
    const perPage = filters.perPage || 20;
    const page = filters.page || 1;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
        .from("listings")
        .select(`
            id, slug, business_name, short_description, phone, logo_url,
            is_featured, is_premium, created_at, address, operating_hours, lat, lng,
            categories!listings_category_id_fkey ( name, slug ),
            barangays ( name, slug )
        `, { count: "exact" })
        .eq("is_active", true)
        .eq("status", "approved");

    // Category or subcategory filter
    if (filters.subcategoryId) {
        query = query.eq("subcategory_id", filters.subcategoryId);
    } else {
        // Match either category_id directly, or subcategory_id in the children list
        const { data: subs } = await supabase
            .from("categories")
            .select("id")
            .eq("parent_id", filters.categoryId);

        const childIds = subs?.map(s => s.id) || [];

        if (childIds.length > 0) {
            query = query.or(`category_id.eq.${filters.categoryId},subcategory_id.in.(${childIds.join(',')})`);
        } else {
            query = query.eq("category_id", filters.categoryId);
        }
    }

    // Barangay filter
    if (filters.barangaySlugs && filters.barangaySlugs.length > 0) {
        // Resolve slugs to IDs for reliable filtering
        const barangayIds = await resolveBarangaySlugs(supabase, filters.barangaySlugs);
        if (barangayIds.length > 0) {
            query = query.in("barangay_id", barangayIds);
        } else {
            // No matching barangays found, should return empty
            query = query.eq("barangay_id", "00000000-0000-0000-0000-000000000000");
        }
    }

    // Featured only
    if (filters.featuredOnly) {
        query = query.eq("is_featured", true);
    }

    // Text search
    if (filters.searchQuery) {
        query = query.or(
            `business_name.ilike.%${filters.searchQuery}%,tags.cs.{${filters.searchQuery}}`
        );
    }

    // Sorting - Always prioritize premium and featured
    query = query
        .order("is_premium", { ascending: false })
        .order("is_featured", { ascending: false });

    switch (filters.sort) {
        case "newest":
            query = query.order("created_at", { ascending: false });
            break;
        case "name_asc":
            query = query.order("business_name", { ascending: true });
            break;
        case "name_desc":
            query = query.order("business_name", { ascending: false });
            break;
        case "featured":
        default:
            query = query.order("created_at", { ascending: false });
            break;
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    return {
        listings: data || [],
        total: count || 0,
        error,
    };
}

/**
 * Fetch barangays grouped by area for filtering.
 */
export async function getBarangaysGrouped(supabase: SupabaseClient) {
    const { data: barangays } = await supabase
        .from("barangays")
        .select("id, name, slug, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (!barangays) return [];

    // Simple grouping: first batch as "Olongapo City", rest based on sort_order
    return [
        {
            header: "Olongapo City",
            items: barangays.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
        },
    ];
}

/**
 * Fetch listing counts for all subcategories of a parent category in one query.
 */
export async function getSubcategoryCounts(supabase: SupabaseClient, categoryId: string) {
    const { data } = await supabase
        .from("listings")
        .select("subcategory_id")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .eq("status", "approved");

    const counts: Record<string, number> = {};
    data?.forEach((l) => {
        if (l.subcategory_id) {
            counts[l.subcategory_id] = (counts[l.subcategory_id] || 0) + 1;
        }
    });
    return counts;
}

/**
 * Fetch listing counts for all barangays, respecting category and subcategory filters.
 */
export async function getBarangayCounts(
    supabase: SupabaseClient,
    categoryId: string,
    subcategoryId?: string
) {
    let query = supabase
        .from("listings")
        .select("barangay_id")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .eq("status", "approved");

    if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
    }

    const { data } = await query;

    const counts: Record<string, number> = {};
    data?.forEach((l) => {
        if (l.barangay_id) {
            counts[l.barangay_id] = (counts[l.barangay_id] || 0) + 1;
        }
    });
    return counts;
}

// ──────────────────────────────────────────────────────────
// Comprehensive Listings Query Builder (Module 4.2)
// ──────────────────────────────────────────────────────────

import { getActiveDay, getPhTime } from "@/lib/search-helpers";
import type { ParsedSearchParams } from "@/lib/search-helpers";

/** Full select string for rich listing data. */
const LISTING_FULL_SELECT = `
    id, slug, business_name, short_description, phone, address,
    logo_url, is_featured, is_premium, created_at, updated_at,
    operating_hours, lat, lng, tags, status, is_active,
    categories!listings_category_id_fkey ( id, name, slug ),
    subcategories:categories!listings_subcategory_id_fkey ( id, name, slug ),
    barangays ( id, name, slug ),
    listing_images ( image_url, sort_order, is_primary ),
    deals ( id ),
    subscriptions ( plan_type, status, end_date )
`;

/** Minimal select for map pins. */
const LISTING_MAP_SELECT = `
    id, business_name, slug, lat, lng,
    is_featured, is_premium,
    categories!listings_category_id_fkey ( name, slug ),
    subcategories:categories!listings_subcategory_id_fkey ( name, slug ),
    listing_images ( image_url, is_primary )
`;

interface BuildListingsOptions {
    filters: ParsedSearchParams;
    categoryId?: string;
    subcategoryId?: string;
    barangayIds?: string[];
    forMap?: boolean;
}

/**
 * Build a comprehensive Supabase listings query with dynamic filters and sorting.
 * Returns { query, countQuery } for paginated use.
 */
export async function buildListingsQuery(supabase: SupabaseClient, options: BuildListingsOptions) {
    const { filters, categoryId, subcategoryId, barangayIds, forMap = false } = options;
    const selectStr = forMap ? LISTING_MAP_SELECT : LISTING_FULL_SELECT;

    let query = supabase
        .from("listings")
        .select(selectStr, { count: forMap ? undefined : "exact" })
        .eq("is_active", true)
        .eq("status", "approved");

    // Category filter
    // If we only have categoryId, we need to fetch listings that belong directly
    // to to this category OR belong to any of its subcategories.
    if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
    } else if (categoryId) {
        // Resolve child categories first because .or() with .in(select...) is not supported
        const { data: subs } = await supabase
            .from("categories")
            .select("id")
            .eq("parent_id", categoryId);

        const childIds = subs?.map(s => s.id) || [];

        if (childIds.length > 0) {
            query = query.or(`category_id.eq.${categoryId},subcategory_id.in.(${childIds.join(',')})`);
        } else {
            query = query.eq("category_id", categoryId);
        }
    }

    // Barangay filter (multi-select by IDs)
    if (barangayIds && barangayIds.length > 0) {
        query = query.in("barangay_id", barangayIds);
    }

    // Featured only
    if (filters.featuredOnly) {
        query = query.eq("is_featured", true);
    }

    // Text search
    if (filters.q) {
        // Use a more precise search: name, specific tags, or prefix matches
        // Also removed short_description from OR as it causes too many false positives
        query = query.or(
            `business_name.ilike.%${filters.q}%,tags.cs.{${filters.q}}`
        );
    }

    // Sorting
    if (!forMap) {
        // Always prioritize premium and featured
        query = query
            .order("is_premium", { ascending: false })
            .order("is_featured", { ascending: false });

        switch (filters.sort) {
            case "newest":
                query = query.order("created_at", { ascending: false });
                break;
            case "name_asc":
                query = query.order("business_name", { ascending: true });
                break;
            case "name_desc":
                query = query.order("business_name", { ascending: false });
                break;
            case "featured":
            default:
                query = query.order("updated_at", { ascending: false });
                break;
        }

        // Pagination
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
    } else {
        // Map view: limit to 500, no pagination
        query = query.limit(500);
    }

    return query;
}

/**
 * Get the current day & time info for "open now" filtering in PH timezone.
 */
export function getOpenNowFilter() {
    return {
        day: getActiveDay(),
        time: getPhTime(),
    };
}

/**
 * Resolve barangay slugs to IDs.
 */
export async function resolveBarangaySlugs(supabase: SupabaseClient, slugs: string[]) {
    if (slugs.length === 0) return [];
    const { data } = await supabase
        .from("barangays")
        .select("id, slug")
        .in("slug", slugs)
        .eq("is_active", true);
    return data?.map((b) => b.id) || [];
}

/**
 * Resolve a category slug to its ID.
 */
export async function resolveCategorySlug(supabase: SupabaseClient, slug: string) {
    const { data } = await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
    return data;
}

// ──────────────────────────────────────────────────────────
// Listing Detail Queries (Module 5.1)
// ──────────────────────────────────────────────────────────

/**
 * Fetch a full listing detail by slug, including all related data.
 */
export async function getListingBySlug(supabase: SupabaseClient, slug: string) {
    const { data: listing, error } = await supabase
        .from("listings")
        .select(`
            id, slug, owner_id, business_name, short_description, full_description,
            address, lat, lng, phone, phone_secondary, email, website,
            social_links, operating_hours, tags, payment_methods,
            logo_url, is_featured, is_premium, is_active, status,
            created_at, updated_at,
            categories!listings_category_id_fkey ( id, name, slug, icon ),
            subcategories:categories!listings_subcategory_id_fkey ( id, name, slug ),
            barangays ( id, name, slug ),
            listing_images ( id, image_url, alt_text, sort_order, is_primary ),
            listing_field_values (
                id, value,
                category_fields (
                    id, field_name, field_label, field_type, sort_order, options
                )
            ),
            deals ( id, title, description, image_url, discount_text, start_date, end_date, is_active ),
            events ( id, title, slug, description, image_url, event_date, start_time, end_time, venue, venue_address, is_active )
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .eq("status", "approved")
        .maybeSingle();

    if (error || !listing) return null;

    // Sort images by sort_order, primary first
    const images = (listing.listing_images || []).sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
    });

    // Filter active deals (not expired)
    const now = new Date();
    const activeDeals = (listing.deals || []).filter((d: any) => {
        return d.is_active && new Date(d.end_date) >= now;
    });

    // Filter upcoming events
    const today = new Date().toISOString().split("T")[0];
    const upcomingEvents = (listing.events || []).filter((e: any) => {
        return e.is_active && e.event_date >= today;
    }).sort((a: any, b: any) => a.event_date.localeCompare(b.event_date));

    // Sort field values by field sort_order
    const fieldValues = (listing.listing_field_values || [])
        .filter((fv: any) => fv.category_fields)
        .sort((a: any, b: any) => a.category_fields.sort_order - b.category_fields.sort_order);

    return {
        ...listing,
        listing_images: images,
        deals: activeDeals,
        events: upcomingEvents,
        listing_field_values: fieldValues,
    };
}

export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListingBySlug>>>;

/**
 * Fetch related listings (same subcategory or category, exclude current).
 */
export async function getRelatedListings(
    supabase: SupabaseClient,
    opts: { categoryId: string; subcategoryId?: string | null; excludeSlug: string; limit?: number }
) {
    const { categoryId, subcategoryId, excludeSlug, limit = 4 } = opts;

    let query = supabase
        .from("listings")
        .select(`
            id, slug, business_name, short_description, phone, logo_url,
            is_featured, is_premium,
            categories!listings_category_id_fkey ( name, slug ),
            barangays ( name, slug ),
            listing_images ( image_url, is_primary )
        `)
        .eq("is_active", true)
        .eq("status", "approved")
        .neq("slug", excludeSlug)
        .limit(limit);

    if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
    } else {
        query = query.eq("category_id", categoryId);
    }

    query = query
        .order("is_featured", { ascending: false })
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false });

    const { data } = await query;
    return data || [];
}

// ──────────────────────────────────────────────────────────
// Module 6.2 - Search API Enhancements
// ──────────────────────────────────────────────────────────

export interface SearchListingsParams {
    search_query?: string | null;
    category_slug?: string | null;
    subcategory_slug?: string | null;
    barangay_slugs?: string[] | null;
    city_slug?: string | null;
    is_open_now?: boolean;
    featured_only?: boolean;
    user_lat?: number | null;
    user_lng?: number | null;
    radius_km?: number;
    sort_by?: string;
    page_number?: number;
    page_size?: number;
}

/**
 * Call the Supabase RPC function `search_listings`.
 */
export async function searchListings(supabase: SupabaseClient, params: SearchListingsParams) {
    const { data, error } = await supabase.rpc("search_listings", params);

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Fetch listings within map geographic bounds.
 */
export async function getListingsInBounds(
    supabase: SupabaseClient,
    bounds: { north: number; south: number; east: number; west: number }
) {
    const { data, error } = await supabase
        .from("listings")
        .select(`
            id, slug, business_name, short_description, phone, 
            logo_url, is_featured, is_premium, 
            created_at, updated_at, lat, lng,
            categories!listings_category_id_fkey ( id, name, slug ),
            barangays ( id, name, slug ),
            listing_images ( image_url, sort_order, is_primary )
        `)
        .eq("status", "approved")
        .eq("is_active", true)
        .gte("lat", bounds.south)
        .lte("lat", bounds.north)
        .gte("lng", bounds.west)
        .lte("lng", bounds.east)
        .limit(200);

    if (error) throw error;

    return data || [];
}

/**
 * Fetch search suggestions based on partial query matching using pg_trgm.
 */
export async function searchSuggestions(supabase: SupabaseClient, query: string) {
    // 1. Business names
    const { data: businesses } = await supabase
        .from("listings")
        .select("business_name, slug")
        .eq("status", "approved")
        .eq("is_active", true)
        .textSearch("business_name", query, { type: "websearch" })
        .limit(5);

    // Fallback if full-text search doesn't match well for short strings
    let businessResults = businesses || [];
    if (businessResults.length === 0) {
        const { data: fuzzyBiz } = await supabase
            .from("listings")
            .select("business_name, slug")
            .eq("status", "approved")
            .eq("is_active", true)
            .ilike("business_name", `%${query}%`)
            .limit(5);
        businessResults = fuzzyBiz || [];
    }

    // 2. Categories
    const { data: categories } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .is("parent_id", null)
        .ilike("name", `%${query}%`)
        .limit(5);

    // 3. Subcategories
    const { data: subcategories } = await supabase
        .from("categories")
        .select("name, slug, parent_id")
        .eq("is_active", true)
        .not("parent_id", "is", null)
        .ilike("name", `%${query}%`)
        .limit(5);

    return {
        businesses: businessResults.map(b => ({ name: b.business_name, slug: b.slug })),
        categories: categories || [],
        subcategories: subcategories || []
    };
}
