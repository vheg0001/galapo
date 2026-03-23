import { createServerSupabaseClient } from "@/lib/supabase";
import { errorResponse } from "@/lib/api-helpers";
import { searchSuggestions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";

        if (query.trim().length < 2) {
            return Response.json({
                success: true,
                data: {
                    businesses: [],
                    categories: [],
                    subcategories: []
                }
            });
        }

        const supabase = await createServerSupabaseClient();
        const suggestions = await searchSuggestions(supabase, query);

        return Response.json({
            success: true,
            data: suggestions
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=59"
            }
        });
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch suggestions", 500);
    }
}
