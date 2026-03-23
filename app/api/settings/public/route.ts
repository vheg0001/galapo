import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Revalidate every 1 hour
export const revalidate = 3600;

export async function GET() {
    try {
        // This route is public and only exposes allowlisted keys, so it can use
        // the admin client without touching request cookies.
        const supabase = createAdminSupabaseClient();

        const { data, error } = await supabase
            .from("site_settings")
            .select("key, value")
            // Fetch only non-sensitive keys. Adjust this list based on actual keys in DB.
            .in("key", [
                "site_name",
                "site_tagline",
                "site_description",
                "contact_email",
                "contact_phone",
                "facebook_url",
                "instagram_url",
                "tiktok_url",
                "twitter_url",
                "youtube_url",
                "maintenance_mode",
                "gcash_number",
                "price_basic",
                "premium_listing_monthly_price",
                "featured_listing_monthly_price",
                "price_claim",
                "reactivation_fee_amount",
                "ad_placement_monthly_price",
                "top_search_monthly_price",
                "advertising_packages"
            ]);

        if (error) {
            throw error;
        }

        // Convert key-value array to object dictionary
        const settingsDictionary = data?.reduce((acc: Record<string, any>, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {}) || {};

        return successResponse(settingsDictionary);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch public settings", 500);
    }
}
