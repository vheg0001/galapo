import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createServerSupabaseClient();
        
        const now = new Date().toISOString();
        const next7Days = new Date();
        next7Days.setDate(next7Days.getDate() + 7);

        // 1. Stats
        const [
            { count: activeCount },
            { count: expiringCount },
            { data: revenueData },
            { data: categories }
        ] = await Promise.all([
            supabase.from("top_search_placements").select("*", { count: "exact", head: true }).eq("is_active", true).lte("start_date", now).gte("end_date", now),
            supabase.from("top_search_placements").select("*", { count: "exact", head: true }).eq("is_active", true).lte("end_date", next7Days.toISOString()).gte("end_date", now),
            supabase.from("payments").select("amount").eq("type", "top_search").in("status", ["paid", "verified"]).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
            supabase.from("categories").select("id, name")
        ]);

        const revenueThisMonth = (revenueData || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalCategories = categories?.length || 0;
        const totalSlots = totalCategories * 3;

        // 2. By Category fill rate
        const { data: categoryPlacements } = await supabase
            .from("top_search_placements")
            .select("category_id")
            .eq("is_active", true)
            .lte("start_date", now)
            .gte("end_date", now);

        const categoryCounts = (categoryPlacements || []).reduce((acc: any, p: any) => {
            acc[p.category_id] = (acc[p.category_id] || 0) + 1;
            return acc;
        }, {});

        const byCategory = (categories || []).map(cat => ({
            category_name: cat.name,
            filled_slots: categoryCounts[cat.id] || 0,
            revenue: 0 // In a more complex query, we could join payments grouped by cat
        }));

        return NextResponse.json({
            active_placements: activeCount || 0,
            total_available_slots: Math.max(0, totalSlots - (activeCount || 0)),
            revenue_this_month: revenueThisMonth,
            expiring_this_week: expiringCount || 0,
            by_category: byCategory
        });

    } catch (error: any) {
        console.error("Top Search Stats GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
