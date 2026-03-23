import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 4;

        const supabase = await createServerSupabaseClient();
        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("events")
            .select(`
                id,
                slug,
                title,
                image_url,
                event_date,
                start_time,
                end_time,
                venue,
                listings ( business_name, slug )
            `)
            .eq("is_active", true)
            .gte("event_date", today)
            .order("event_date", { ascending: true })
            .limit(limit);

        if (error) {
            throw error;
        }

        return successResponse(data);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch upcoming events", 500);
    }
}
