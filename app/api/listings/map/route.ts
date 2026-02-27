import { createServerSupabaseClient } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";
import { parseSearchParams } from "@/lib/search-helpers";
import { buildListingsQuery, resolveBarangaySlugs, resolveCategorySlug } from "@/lib/queries";

// Dynamic route - no caching for filtered map results
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = parseSearchParams(searchParams);
        const supabase = await createServerSupabaseClient();

        // Resolve slugs → IDs
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

        const barangayIds = await resolveBarangaySlugs(supabase, filters.barangay);

        // Build lightweight map query
        const query = await buildListingsQuery(supabase, {
            filters,
            categoryId,
            subcategoryId,
            barangayIds: barangayIds.length > 0 ? barangayIds : undefined,
            forMap: true,
        });

        const { data, error } = await query;
        if (error) throw error;

        // Transform to minimal map pin data
        const pins = (data || [])
            .filter((l: any) => l.lat && l.lng)
            .map((l: any) => {
                const cat = Array.isArray(l.categories) ? l.categories[0] : l.categories;
                const sub = Array.isArray(l.subcategories) ? l.subcategories[0] : l.subcategories;
                const images = Array.isArray(l.listing_images) ? l.listing_images : [];
                const primaryImage = images.find((i: any) => i.is_primary) || images[0];

                return {
                    id: l.id,
                    business_name: l.business_name,
                    slug: l.slug,
                    lat: l.lat,
                    lng: l.lng,
                    category_name: cat?.name || null,
                    subcategory_name: sub?.name || null,
                    is_featured: l.is_featured,
                    is_premium: l.is_premium,
                    primary_image_url: primaryImage?.image_url || null,
                };
            });

        return Response.json({
            success: true,
            data: pins,
            total: pins.length,
        });
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch map listings", 500);
    }
}
