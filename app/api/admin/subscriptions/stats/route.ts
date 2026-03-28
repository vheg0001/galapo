import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) return auth.error;

        const supabase = createAdminSupabaseClient();
        const now = new Date();
        const nowIso = now.toISOString();
        const next7Days = new Date(now);
        next7Days.setDate(now.getDate() + 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        const [
            { data: activeSubscriptions, error: activeSubscriptionsError },
            { count: expiredThisMonth, error: expiredThisMonthError },
            { data: verifiedPayments, error: verifiedPaymentsError },
        ] = await Promise.all([
            supabase
                .from("subscriptions")
                .select("plan_type, end_date, amount")
                .eq("status", "active")
                .gte("end_date", nowIso),
            supabase
                .from("subscriptions")
                .select("*", { count: "exact", head: true })
                .eq("status", "expired")
                .gte("updated_at", startOfMonth),
            supabase
                .from("payments")
                .select("amount, created_at, subscription_id (plan_type)")
                .eq("status", "verified")
                .gte("created_at", startOfLastMonth),
        ]);

        if (activeSubscriptionsError) throw activeSubscriptionsError;
        if (expiredThisMonthError) throw expiredThisMonthError;
        if (verifiedPaymentsError) throw verifiedPaymentsError;

        const activeRows = activeSubscriptions || [];
        const activeFeatured = activeRows.filter((subscription) => subscription.plan_type === "featured").length;
        const activePremium = activeRows.filter((subscription) => subscription.plan_type === "premium").length;
        const expiringThisWeek = activeRows.filter((subscription) => {
            if (!subscription.end_date) return false;
            const endDate = new Date(subscription.end_date);
            return endDate >= now && endDate <= next7Days;
        }).length;
        const activeMrr = activeRows.reduce((sum, subscription) => sum + Number(subscription.amount || 0), 0);

        const thisMonthRevenue = (verifiedPayments || [])
            .filter((payment) => payment.created_at >= startOfMonth)
            .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        const lastMonthRevenue = (verifiedPayments || [])
            .filter((payment) => payment.created_at >= startOfLastMonth && payment.created_at <= endOfLastMonth)
            .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        const revByPlan = (verifiedPayments || [])
            .filter((payment) => payment.created_at >= startOfMonth)
            .reduce((acc: Record<string, number>, payment: any) => {
                const type = payment.subscription_id?.plan_type || "other";
                acc[type] = (acc[type] || 0) + Number(payment.amount || 0);
                return acc;
            }, { featured: 0, premium: 0 });

        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString("default", { month: "short" });
            trends.push({ month: monthName, revenue: 0, count: 0 });
        }

        return NextResponse.json({
            active_featured: activeFeatured,
            active_premium: activePremium,
            expiring_this_week: expiringThisWeek,
            expired_this_month: expiredThisMonth || 0,
            active_mrr: activeMrr,
            revenue_this_month: thisMonthRevenue,
            revenue_last_month: lastMonthRevenue,
            revenue_by_plan: revByPlan,
            monthly_trend: trends,
        });
    } catch (error: any) {
        console.error("Admin subscription stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
