import { createServerSupabaseClient } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";
import { getListingsInBounds } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const north = parseFloat(searchParams.get("north") || "");
        const south = parseFloat(searchParams.get("south") || "");
        const east = parseFloat(searchParams.get("east") || "");
        const west = parseFloat(searchParams.get("west") || "");

        if (isNaN(north) || isNaN(south) || isNaN(east) || isNaN(west)) {
            return errorResponse("Missing or invalid bounding box parameters (north, south, east, west).", 400);
        }

        const supabase = await createServerSupabaseClient();

        const bounds = { north, south, east, west };
        const mapListings = await getListingsInBounds(supabase, bounds);

        return Response.json({
            success: true,
            data: mapListings
        });
    } catch (error: any) {
        return errorResponse(error.message || "Failed to search area", 500);
    }
}
