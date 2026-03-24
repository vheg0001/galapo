import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) {
            return auth.error;
        }

        const supabase = createAdminSupabaseClient();
        const { searchParams } = new URL(req.url);

        // Parameters
        const status = searchParams.get("status") || "all";
        const plan = searchParams.get("plan") || "all";
        const search = searchParams.get("search");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");
        const sortBy = searchParams.get("sort_by") || "created_at";
        const sortOrder = searchParams.get("sort_order") || "desc";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        // Base Query
        let query = supabase
            .from("subscriptions")
            .select(`
                *,
                listings (
                    id,
                    business_name,
                    slug,
                    owner_id,
                    profiles (
                        id,
                        full_name,
                        email
                    )
                ),
                payments (
                    id,
                    status,
                    amount,
                    created_at
                )
            `, { count: "exact" });

        // Filters
        if (status !== "all") {
            if (status === "expiring_soon") {
                const now = new Date();
                const next7Days = new Date();
                next7Days.setDate(now.getDate() + 7);
                query = query
                    .eq("status", "active")
                    .gte("end_date", now.toISOString())
                    .lte("end_date", next7Days.toISOString());
            } else {
                query = query.eq("status", status);
            }
        }

        if (plan !== "all") {
            query = query.eq("plan_type", plan);
        }

        if (search) {
          query = query.ilike("listings.business_name", `%${search}%`);
        }

        if (dateFrom) {
            query = query.gte("end_date", dateFrom);
        }
        if (dateTo) {
            query = query.lte("end_date", dateTo);
        }

        // Sorting
        // Map frontend sort keys to database columns if needed
        let orderCol = sortBy;
        if (sortBy === "business_name") orderCol = "listings.business_name";
        query = query.order(orderCol, { ascending: sortOrder === "asc" });

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        // Flatten data for frontend table
        const flattenedData = (data as any[] || []).map(sub => {
            const listing = sub.listings;
            const owner = listing?.profiles;
            const latestPayment = sub.payments?.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            return {
                ...sub,
                business_name: listing?.business_name || "N/A",
                owner_name: owner?.full_name || "N/A",
                owner_email: owner?.email || "N/A",
                payment_status: latestPayment?.status || "none",
                // Keep the original nested objects if needed by other components
            };
        });

        // Calculate Revenue and Status Counts (Optimized: we might want separate queries for stats)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        // 1. Status Counts
        const { data: statusCountsData, error: countErr } = await supabase.rpc('get_subscription_status_counts');
        // If RPC doesn't exist, we fallback to manual count (though RPC is better)
        let statusCounts = statusCountsData || {};

        // 2. Revenue (This Month vs Last Month)
        const { data: revenueData, error: revErr } = await supabase
            .from("payments")
            .select("amount, created_at")
            .in("status", ["paid", "verified"])
            .gte("created_at", startOfLastMonth);
        
        if (revErr) console.error("Revenue fetch error:", revErr);

        const thisMonthRevenue = (revenueData || [])
            .filter(p => p.created_at >= startOfMonth)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const lastMonthRevenue = (revenueData || [])
            .filter(p => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth)
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        return NextResponse.json({
            success: true,
            data: flattenedData,
            total: count,
            stats: {
                status_counts: statusCounts,
                revenue: {
                    this_month: thisMonthRevenue,
                    last_month: lastMonthRevenue
                }
            }
        });

    } catch (error: any) {
        console.error("Admin subscriptions GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
