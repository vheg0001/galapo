import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Revalidate every 1 hour
export const revalidate = 3600;

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from("site_settings")
            .select("key, value")
            // Fetch only non-sensitive keys. Adjust this list based on actual keys in DB.
            .in("key", [
                "site_name",
                "tagline",
                "contact_email",
                "contact_phone",
                "facebook_url",
                "instagram_url",
                "twitter_url",
                "gcash_number"
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
