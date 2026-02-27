import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { getCategoryBySlug } from "@/lib/queries";

// Revalidate every 15 minutes
export const revalidate = 900;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createServerSupabaseClient();

        // Fetch the category by slug
        const { data: category, error } = await supabase
            .from("categories")
            .select("id, name, slug, icon, parent_id, description, is_active, sort_order")
            .eq("slug", slug)
            .maybeSingle();

        if (error) throw error;
        if (!category || !category.is_active) {
            return errorResponse("Category not found", 404);
        }

        let responseData: any = { ...category };

        if (!category.parent_id) {
            // Parent category — fetch subcategories with listing counts
            const { data: subcategories } = await supabase
                .from("categories")
                .select("id, name, slug, icon, sort_order")
                .eq("parent_id", category.id)
                .eq("is_active", true)
                .order("sort_order", { ascending: true })
                .order("name", { ascending: true });

            // Get listing counts per subcategory
            const { data: listings } = await supabase
                .from("listings")
                .select("subcategory_id")
                .eq("category_id", category.id)
                .eq("is_active", true)
                .eq("status", "approved");

            const countMap: Record<string, number> = {};
            listings?.forEach((l) => {
                if (l.subcategory_id) {
                    countMap[l.subcategory_id] = (countMap[l.subcategory_id] || 0) + 1;
                }
            });

            responseData.subcategories = (subcategories || []).map((sub) => ({
                ...sub,
                listing_count: countMap[sub.id] || 0,
            }));

            // Get total listing count for parent
            const { count } = await supabase
                .from("listings")
                .select("id", { count: "exact", head: true })
                .eq("category_id", category.id)
                .eq("is_active", true)
                .eq("status", "approved");

            responseData.listing_count = count || 0;
        } else {
            // Subcategory — fetch parent info
            const { data: parent } = await supabase
                .from("categories")
                .select("id, name, slug, icon")
                .eq("id", category.parent_id)
                .eq("is_active", true)
                .maybeSingle();

            responseData.parent = parent;

            // Listing count for this subcategory
            const { count } = await supabase
                .from("listings")
                .select("id", { count: "exact", head: true })
                .eq("subcategory_id", category.id)
                .eq("is_active", true)
                .eq("status", "approved");

            responseData.listing_count = count || 0;
        }

        // Fetch category_fields (dynamic fields for this category)
        const { data: fields } = await supabase
            .from("category_fields")
            .select("id, field_name, field_type, is_required, options, sort_order")
            .eq("category_id", category.id)
            .order("sort_order", { ascending: true });

        responseData.category_fields = fields || [];

        return successResponse(responseData);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch category", 500);
    }
}
