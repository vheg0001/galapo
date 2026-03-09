import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Force dynamic for API routes using request.url or cookies
export const dynamic = "force-dynamic";

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
            .in("status", ["approved", "claimed_pending"])
            .eq("is_active", true)
            .or("is_featured.eq.true,is_premium.eq.true")
            .order("is_premium", { ascending: false })
            .order("is_featured", { ascending: false })
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
