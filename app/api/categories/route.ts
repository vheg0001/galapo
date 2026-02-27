import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// Revalidate every 30 minutes (1800 seconds)
export const revalidate = 1800;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const parentOnly = searchParams.get("parent_only") === "true";

        const supabase = await createServerSupabaseClient();

        // 1. Fetch categories
        let query = supabase
            .from("categories")
            .select("id, name, slug, icon, parent_id, sort_order")
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
            .eq("status", "approved")
            .eq("is_active", true);

        if (listError) throw listError;

        const countMap: Record<string, number> = {};
        listings?.forEach((listing) => {
            countMap[listing.category_id] = (countMap[listing.category_id] || 0) + 1;
        });

        // 3. Structure into nested (if not parent_only) and attach counts
        const enrichedCategories = categories?.map((cat) => ({
            ...cat,
            listing_count: countMap[cat.id] || 0,
            subcategories: [], // Will populate below if needed
        }));

        let responseData = enrichedCategories;

        if (!parentOnly) {
            // Build tree
            const parentCats = enrichedCategories?.filter((c) => c.parent_id === null) || [];
            const subCats = enrichedCategories?.filter((c) => c.parent_id !== null) || [];

            parentCats.forEach((parent) => {
                const children = subCats.filter((child) => child.parent_id === parent.id);
                (parent as any).subcategories = children;
                // Accumulate parent count = direct count + ALL children counts
                const childCount = children.reduce((sum, child) => sum + child.listing_count, 0);
                parent.listing_count += childCount;
            });

            responseData = parentCats;
        }

        return successResponse(responseData);
    } catch (error: any) {
        return errorResponse(error.message || "Failed to fetch categories", 500);
    }
}
