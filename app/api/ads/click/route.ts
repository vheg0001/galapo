import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ad_id } = body;

        if (!ad_id) {
            return errorResponse("Missing ad_id in request body", 400);
        }

        const supabase = await createServerSupabaseClient();

        // Assuming you have an RPC function 'increment_ad_click' in your database.
        // If not, a direct update could work (but is subject to race conditions without RPC).
        // Let's use RPC if available, otherwise direct update.
        const { error } = await supabase.rpc("increment_ad_click", { target_ad_id: ad_id });

        if (error) {
            console.error("RPC increment_ad_click failed or missing, trying direct update:", error.message);

            // Fallback strategy if RPC doesn't exist (less safe against race conditions but functional)
            // fetch current -> +1 -> update
            const { data: ad } = await supabase.from("ad_placements").select("clicks").eq("id", ad_id).single();
            if (ad) {
                await supabase.from("ad_placements").update({ clicks: (ad.clicks || 0) + 1 }).eq("id", ad_id);
            }
        }

        return successResponse({ success: true });
    } catch (error: any) {
        return errorResponse(error.message || "Failed to record ad click", 500);
    }
}
