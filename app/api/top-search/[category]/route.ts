import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Dynamic route
export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ category: string }> }
) {
    try {
        const { category: categorySlug } = await params;
        const supabase = await createServerSupabaseClient();

        // Resolve category slug → ID
        const { data: category } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", categorySlug)
            .eq("is_active", true)
            .maybeSingle();

        if (!category) {
            return errorResponse("Category not found", 404);
        }

        const today = new Date().toISOString().split("T")[0];

        const { data: placements, error } = await supabase
            .from("top_search_placements")
            .select(`
                id, position, start_date, end_date,
                listings:listing_id (
                    id, slug, business_name, short_description, phone, address,
                    logo_url, image_url, is_featured, is_premium, created_at, updated_at,
                    operating_hours, lat, lng, tags,
                    categories!listings_category_id_fkey ( id, name, slug ),
                    subcategories:categories!listings_subcategory_id_fkey ( id, name, slug ),
                    barangays ( id, name, slug ),
                    listing_images ( image_url, sort_order, is_primary ),
                    deals ( id ),
                    subscriptions ( plan_type, status, end_date )
                )
            `)
            .eq("category_id", category.id)
            .eq("is_active", true)
            .lte("start_date", today)
            .gte("end_date", today)
            .order("position", { ascending: true });

        if (error) throw error;

        const enrichedPlacements = (placements || [])
            .map((p: any) => {
                const listing = Array.isArray(p.listings) ? p.listings[0] : p.listings;
                if (!listing) return null;

                const images = Array.isArray(listing.listing_images) ? listing.listing_images : [];
                const primaryImage = images.find((i: any) => i.is_primary) || images[0];
                const cat = Array.isArray(listing.categories) ? listing.categories[0] : listing.categories;
                const sub = Array.isArray(listing.subcategories) ? listing.subcategories[0] : listing.subcategories;
                const brgy = Array.isArray(listing.barangays) ? listing.barangays[0] : listing.barangays;
                const subs = Array.isArray(listing.subscriptions) ? listing.subscriptions : [];
                const activeSub = subs.find(
                    (s: any) => s.status === "active" && new Date(s.end_date) > new Date()
                );

                return {
                    position: p.position,
                    placement_id: p.id,
                    listing: {
                        id: listing.id,
                        slug: listing.slug,
                        business_name: listing.business_name,
                        short_description: listing.short_description,
                        phone: listing.phone,
                        address: listing.address,
                        logo_url: listing.logo_url,
                        image_url: listing.image_url,
                        is_featured: listing.is_featured,
                        is_premium: listing.is_premium,
                        created_at: listing.created_at,
                        lat: listing.lat,
                        lng: listing.lng,
                        primary_image: primaryImage?.image_url || listing.image_url || null,
                        category_name: cat?.name || null,
                        subcategory_name: sub?.name || null,
                        barangay_name: brgy?.name || null,
                        active_deals_count: Array.isArray(listing.deals) ? listing.deals.length : 0,
                        current_plan: activeSub?.plan_type || "free",
                        is_sponsored: true,
                    },
                };
            })
            .filter(Boolean);

        return successResponse(enrichedPlacements);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch top search placements", 500);
    }
}
