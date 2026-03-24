import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) return auth.error;

        const supabase = createAdminSupabaseClient();
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        // Parallel fetch for overview stats
        const [
            { count: activeFeatured },
            { count: activePremium },
            { count: expiringNextWeek },
            { count: expiredThisMonth },
            { data: revenueData }
        ] = await Promise.all([
            supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("plan_type", "featured"),
            supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("plan_type", "premium"),
            supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").lte("end_date", next7Days.toISOString()).gte("end_date", now.toISOString()),
            supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "expired").gte("updated_at", startOfMonth),
            supabase.from("payments").select("amount, created_at, subscription_id (plan_type)").in("status", ["paid", "verified"]).gte("created_at", startOfLastMonth)
        ]);

        const thisMonthRevenue = (revenueData || [])
            .filter(p => p.created_at >= startOfMonth)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const lastMonthRevenue = (revenueData || [])
            .filter(p => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth)
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const revByPlan = (revenueData || [])
            .filter(p => p.created_at >= startOfMonth)
            .reduce((acc: any, p: any) => {
                const type = p.subscription_id?.plan_type || "other";
                acc[type] = (acc[type] || 0) + (p.amount || 0);
                return acc;
            }, { featured: 0, premium: 0 });

        // Trends (simplified simulation of last 6 months)
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('default', { month: 'short' });
            // In a real scenario, we'd query grouped by month
            trends.push({ month: monthName, revenue: 0, count: 0 }); 
        }

        return NextResponse.json({
            active_featured: activeFeatured || 0,
            active_premium: activePremium || 0,
            expiring_this_week: expiringNextWeek || 0,
            expired_this_month: expiredThisMonth || 0,
            revenue_this_month: thisMonthRevenue,
            revenue_last_month: lastMonthRevenue,
            revenue_by_plan: revByPlan,
            monthly_trend: trends
        });

    } catch (error: any) {
        console.error("Admin subscription stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
