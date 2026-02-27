import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveAdsForLocation } from "@/lib/queries";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get("location");
        const positionParam = searchParams.get("position");
        const position = positionParam ? parseInt(positionParam, 10) : 1;

        if (!location) {
            return errorResponse("Missing placement location parameter", 400);
        }

        const supabase = await createServerSupabaseClient();
        const { data: ad, error } = await getActiveAdsForLocation(supabase, location, position);

        if (error) {
            throw error;
        }

        if (!ad) {
            return successResponse(null); // No active ad for this slot
        }

        // Fire-and-forget an impression tracking request
        // In a real high-traffic app, this might be better handled via Edge Functions or batched
        supabase.rpc("increment_ad_impression", { ad_id: ad.id }).then();

        // Format response returning AdSense ID if appropriate, otherwise direct image/url
        const formattedAd = ad.is_adsense
            ? { id: ad.id, is_adsense: true, adsense_slot_id: ad.adsense_slot_id }
            : { id: ad.id, is_adsense: false, image_url: ad.image_url, target_url: ad.target_url, title: ad.title };

        return successResponse(formattedAd);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch ad placement", 500);
    }
}
