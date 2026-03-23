import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        const { data: badges, error } = await supabase
            .from("badges")
            .select("*")
            .eq("is_active", true)
            .eq("is_filterable", true)
            .order("priority", { ascending: true })
            .order("name", { ascending: true });

        if (error) throw error;

        return successResponse(badges || []);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch badges", 500);
    }
}
