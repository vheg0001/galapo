import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Dynamic route, no aggressive caching for latest listings
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 6;

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
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch latest listings", 500);
    }
}
