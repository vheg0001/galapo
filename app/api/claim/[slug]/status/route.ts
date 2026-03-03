import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/claim/[slug]/status
 * Check if a listing is claimable or its current claim status
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    try {
        const supabase = await createServerSupabaseClient();

        const { data: listing, error } = await supabase
            .from("listings")
            .select("id, business_name, owner_id, status, is_pre_populated")
            .eq("slug", slug)
            .single();

        if (error || !listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        const isClaimable = !listing.owner_id && listing.is_pre_populated;

        return NextResponse.json({
            listing_id: listing.id,
            business_name: listing.business_name,
            is_claimable: isClaimable,
            current_status: listing.status,
            is_managed: !!listing.owner_id
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
