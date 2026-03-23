import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getListingBySlug } from "@/lib/queries";
import { trackPageViewServer } from "@/lib/analytics.server";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch listing with all relations
    const listingData = await getListingBySlug(supabase, slug);

    if (!listingData) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Track page view asynchronously
    // We don't await this to keep the response fast
    trackPageViewServer(listingData.id).catch(err => console.error("Tracking error:", err));

    // Prepare response data matching requirements
    const response = {
        listing: {
            ...listingData,
            category: listingData.categories,
            subcategory: listingData.subcategories,
            barangay: listingData.barangays,
            // City is usually fetched via city_id, let's assume it's part of the query or fetch it
            // Based on queries.ts, we might need to join cities table
            images: listingData.listing_images,
            dynamic_fields: listingData.listing_field_values.map((fv: any) => ({
                field: fv.category_fields,
                value: fv.value
            })),
            active_deals: listingData.deals,
            upcoming_events: listingData.events,
            current_plan: listingData.is_premium ? "premium" : listingData.is_featured ? "featured" : "free",
            is_claimed: !!listingData.owner_id,
            has_owner: !!listingData.owner_id
        }
    };

    return NextResponse.json(response, {
        headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59"
        }
    });
}
