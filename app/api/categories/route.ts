import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const parentOnly = searchParams.get("parent_only") === "true";
        const includeFields = searchParams.get("include_fields") === "true";

        const supabase = createAdminSupabaseClient();

        // 1. Fetch categories
        let query = supabase
            .from("categories")
            .select("id, name, slug, icon, parent_id, sort_order, description")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });

        if (parentOnly) {
            query = query.is("parent_id", null);
        }

        const { data: categories, error: catError } = await query;
        if (catError) throw catError;

        // 2. Fetch listing counts per category (only approved & active)
        // Since Supabase RPC count aggregate is best but we might not have it,
        // we'll fetch ID + category_id for all active listings and aggregate in memory.
        // For large datasets, this should be moved to a Postgres View or RPC.
        const { data: listings, error: listError } = await supabase
            .from("listings")
            .select("id, category_id")
            .in("status", ["approved", "claimed_pending"])
            .eq("is_active", true);

        if (listError) throw listError;

        const countMap: Record<string, number> = {};
        listings?.forEach((listing) => {
            countMap[listing.category_id] = (countMap[listing.category_id] || 0) + 1;
        });

        // 3. Optionally fetch category fields for the wizard
        let fields: any[] = [];
        if (includeFields) {
            const { data: fieldsData, error: fieldsError } = await supabase
                .from("category_fields")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });
            if (fieldsError) throw fieldsError;
            fields = fieldsData || [];
        }

        // 4. Structure into nested (if not parent_only) and attach counts
        const enrichedCategories = categories?.map((cat) => ({
            ...cat,
            listing_count: countMap[cat.id] || 0,
            subcategories: [],
            fields: includeFields
                ? fields.filter((f) => f.category_id === cat.id && !f.subcategory_id)
                : [],
        }));

        let responseData = enrichedCategories;

        if (!parentOnly) {
            // Recursive function to build the category tree
            const buildTree = (parentId: string | null): any[] => {
                const children = enrichedCategories?.filter(c => c.parent_id === parentId) || [];

                return children.map(cat => {
                    const subcategories = buildTree(cat.id);

                    // Attach fields for this category/subcategory
                    const catFields = includeFields
                        ? fields.filter(f =>
                            (f.category_id === cat.id && !f.subcategory_id) ||
                            (f.subcategory_id === cat.id)
                        )
                        : [];

                    // Aggregate counts from subcategories
                    const subCount = subcategories.reduce((sum, sub) => sum + (sub.listing_count || 0), 0);

                    return {
                        ...cat,
                        listing_count: cat.listing_count + subCount,
                        subcategories,
                        fields: catFields
                    };
                });
            };

            responseData = buildTree(null);
        }

        return successResponse(responseData);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch categories", 500);
    }
}
