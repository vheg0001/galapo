import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 10;

        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from("listings")
            .select(`
                id, 
                slug, 
                business_name, 
                short_description, 
                phone, 
                logo_url, 
                image_url,
                is_featured, 
                is_premium,
                categories!listings_category_id_fkey ( name, slug ),
                barangays ( name, slug )
            `)
            .eq("status", "approved")
            .eq("is_active", true)
            .eq("is_featured", true)
            // Order by premium first, then newest
            .order("is_premium", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch featured listings", 500);
    }
}
