import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Revalidate every 1 hour
export const revalidate = 3600;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cityParam = searchParams.get("city") || "olongapo";

        const supabase = await createServerSupabaseClient();

        // We assume city maps to city_id via slug or name. In this schema, barangays link to cities.
        // First get city ID
        const { data: city, error: cityError } = await supabase
            .from("cities")
            .select("id")
            .ilike("slug", cityParam)
            .single();

        if (cityError || !city) {
            return errorResponse("City not found", 404);
        }

        const { data, error } = await supabase
            .from("barangays")
            .select("id, name, slug, zip_code")
            .eq("city_id", city.id)
            .eq("is_active", true)
            .order("name", { ascending: true });

        if (error) {
            throw error;
        }

        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch barangays", 500);
    }
}
