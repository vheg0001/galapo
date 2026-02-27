import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 8;

        const supabase = await createServerSupabaseClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("deals")
            .select(`
                id,
                title,
                description,
                image_url,
                discount_text,
                end_date,
                listings!inner ( slug, business_name, status, is_active, categories (name) )
            `)
            .eq("is_active", true)
            .gte("end_date", now)
            .eq("listings.status", "approved")
            .eq("listings.is_active", true)
            .order("end_date", { ascending: true })
            .limit(limit);

        if (error) {
            throw error;
        }

        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch active deals", 500);
    }
}
