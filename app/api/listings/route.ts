import { createServerSupabaseClient } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";
import { parseSearchParams, isOpenNow } from "@/lib/search-helpers";
import { buildListingsQuery, resolveBarangaySlugs, resolveCategorySlug } from "@/lib/queries";

// Dynamic route - no caching for filtered results
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = parseSearchParams(searchParams);
        const supabase = await createServerSupabaseClient();

        // Resolve category slug → ID
        let categoryId: string | undefined;
        let subcategoryId: string | undefined;

        if (filters.subcategory) {
            const sub = await resolveCategorySlug(supabase, filters.subcategory);
            if (sub) subcategoryId = sub.id;
        }
        if (filters.category) {
            const cat = await resolveCategorySlug(supabase, filters.category);
            if (cat) categoryId = cat.id;
        }

        // Resolve barangay slugs → IDs
        const barangayIds = await resolveBarangaySlugs(supabase, filters.barangay);

        // --- Fetch sponsored listings (top_search_placements) ---
        let sponsored: any[] = [];
        if (categoryId) {
            const today = new Date().toISOString().split("T")[0];
            const { data: placements } = await supabase
                .from("top_search_placements")
                .select(`
                    id, position,
                    listings:listing_id (
                        id, slug, business_name, short_description, phone, address,
                        logo_url, is_featured, is_premium, created_at, updated_at,
                        operating_hours, lat, lng, tags,
                        categories!listings_category_id_fkey ( id, name, slug ),
                        subcategories:categories!listings_subcategory_id_fkey ( id, name, slug ),
                        barangays ( id, name, slug ),
                        listing_images ( image_url, sort_order, is_primary ),
                        deals ( id ),
                        subscriptions ( plan_type, status, end_date )
                    )
                `)
                .eq("category_id", categoryId)
                .eq("is_active", true)
                .lte("start_date", today)
                .gte("end_date", today)
                .order("position", { ascending: true });

            sponsored = (placements || [])
                .map((p: any) => {
                    const listing = Array.isArray(p.listings) ? p.listings[0] : p.listings;
                    if (!listing || listing.status !== "approved" || !listing.is_active) return null;
                    return enrichListing(listing, true);
                })
                .filter(Boolean);
        }

        // --- Fetch regular listings ---
        const query = await buildListingsQuery(supabase, {
            filters,
            categoryId,
            subcategoryId,
            barangayIds: barangayIds.length > 0 ? barangayIds : undefined,
        });

        const { data, count, error } = await query;
        if (error) throw error;

        let listings = (data || []).map((l: any) => enrichListing(l, false));

        // Open now filter (client-side since JSONB comparison is complex)
        if (filters.openNow) {
            listings = listings.filter((l: any) => isOpenNow(l.operating_hours));
        }

        const total = filters.openNow ? listings.length : (count || 0);
        const totalPages = Math.ceil(total / filters.limit);

        return Response.json({
            success: true,
            data: listings,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                total_pages: totalPages,
                has_next: filters.page < totalPages,
                has_previous: filters.page > 1,
            },
            sponsored,
            filters_applied: {
                category: filters.category,
                subcategory: filters.subcategory,
                barangay: filters.barangay.length > 0 ? filters.barangay : null,
                search: filters.q,
                featured_only: filters.featuredOnly,
                open_now: filters.openNow,
                sort: filters.sort,
            },
        });
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch listings", 500);
    }
}

/**
 * Enrich a raw listing with computed fields.
 */
function enrichListing(listing: any, isSponsored: boolean) {
    // Get primary image
    const images = Array.isArray(listing.listing_images) ? listing.listing_images : [];
    const primaryImage = images.find((i: any) => i.is_primary) || images.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0];

    // Get category/subcategory names
    const cat = Array.isArray(listing.categories) ? listing.categories[0] : listing.categories;
    const subcat = Array.isArray(listing.subcategories) ? listing.subcategories[0] : listing.subcategories;
    const brgy = Array.isArray(listing.barangays) ? listing.barangays[0] : listing.barangays;

    // Count active deals
    const activeDealCount = Array.isArray(listing.deals) ? listing.deals.length : 0;

    // Get current plan from active subscription
    const subs = Array.isArray(listing.subscriptions) ? listing.subscriptions : [];
    const activeSub = subs.find(
        (s: any) => s.status === "active" && new Date(s.end_date) > new Date()
    );

    return {
        id: listing.id,
        slug: listing.slug,
        business_name: listing.business_name,
        short_description: listing.short_description,
        phone: listing.phone,
        address: listing.address,
        logo_url: listing.logo_url,
        is_featured: listing.is_featured,
        is_premium: listing.is_premium,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
        operating_hours: listing.operating_hours,
        lat: listing.lat,
        lng: listing.lng,
        tags: listing.tags,
        primary_image: primaryImage?.image_url || null,
        category_name: cat?.name || null,
        subcategory_name: subcat?.name || null,
        barangay_name: brgy?.name || null,
        active_deals_count: activeDealCount,
        current_plan: activeSub?.plan_type || "free",
        is_sponsored: isSponsored,
    };
}
