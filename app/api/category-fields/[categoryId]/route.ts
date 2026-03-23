import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/category-fields/[categoryId]
 * Fetch dynamic field configurations for a category or subcategory
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ categoryId: string }> }
) {
    const { categoryId } = await params;
    const { searchParams } = new URL(_req.url);
    const subcategoryId = searchParams.get("subcategory_id");

    try {
        const supabase = await createServerSupabaseClient();

        // Build base query
        let query = supabase
            .from("category_fields")
            .select("*")
            .eq("category_id", categoryId);

        // If subcategory is provided, include fields belonging to the subcategory
        // or fields belonging ONLY to the parent category (where subcategory_id is NULL)
        if (subcategoryId) {
            query = query.or(`subcategory_id.is.null,subcategory_id.eq.${subcategoryId}`);
        } else {
            query = query.is("subcategory_id", null);
        }

        const { data, error } = await query
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
