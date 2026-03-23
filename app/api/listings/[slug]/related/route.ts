import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getListingBySlug, getRelatedListings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    // Need category/subcategory IDs to find related listings
    const listing = await getListingBySlug(supabase, slug);

    if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const related = await getRelatedListings(supabase, {
        categoryId: (listing.categories as any).id,
        subcategoryId: (listing.subcategories as any)?.id,
        excludeSlug: slug,
        limit: 4
    });

    const leanRelated = related.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        business_name: r.business_name,
        short_description: r.short_description,
        phone: r.phone,
        logo_url: r.logo_url,
        is_featured: r.is_featured,
        is_premium: r.is_premium,
        category: r.categories,
        barangay: r.barangays,
        image_url: r.listing_images?.find((i: any) => i.is_primary)?.image_url || r.listing_images?.[0]?.image_url
    }));

    return NextResponse.json({ listings: leanRelated });
}
