import { createServerSupabaseClient } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";
import { parseSearchParams } from "@/lib/search-helpers";
import { searchListings, type SearchListingsParams } from "@/lib/queries";

// Dynamic route - no caching for filtered results
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = parseSearchParams(searchParams);
        const supabase = await createServerSupabaseClient();

        // Extract geo parameters if available
        const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
        const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
        const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 10;

        const rpcParams: SearchListingsParams = {
            search_query: filters.q || null,
            category_slug: filters.category || null,
            subcategory_slug: filters.subcategory || null,
            barangay_slugs: filters.barangay.length > 0 ? filters.barangay : null,
            city_slug: filters.city || 'olongapo',
            is_open_now: filters.openNow,
            featured_only: filters.featuredOnly,
            user_lat: !isNaN(lat!) ? lat : null,
            user_lng: !isNaN(lng!) ? lng : null,
            radius_km: !isNaN(radius) ? radius : 10,
            sort_by: filters.sort,
            page_number: filters.page,
            page_size: filters.limit
        };

        const result = await searchListings(supabase, rpcParams);

        const totalPages = Math.ceil(result.total / filters.limit);

        return Response.json({
            success: true,
            data: result.listings || [],
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: result.total,
                total_pages: totalPages,
                has_next: filters.page < totalPages,
                has_previous: filters.page > 1,
            },
            sponsored: result.sponsored || [],
            filters_applied: {
                category: filters.category,
                subcategory: filters.subcategory,
                barangay: filters.barangay.length > 0 ? filters.barangay : null,
                search: filters.q,
                featured_only: filters.featuredOnly,
                open_now: filters.openNow,
                sort: filters.sort,
                lat: rpcParams.user_lat,
                lng: rpcParams.user_lng,
                radius: rpcParams.radius_km
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
