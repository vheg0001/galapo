import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 3;

        const supabase = createAdminSupabaseClient();

        const { data, error } = await supabase
            .from("blog_posts")
            .select("id, slug, title, excerpt, featured_image_url, published_at")
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch latest blog posts", 500);
    }
}
