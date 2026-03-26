import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [
            { count: totalDueCount },
            { count: pendingCount },
            { count: pastDeadlineCount },
            { count: confirmedMonthCount },
            { count: deactivatedMonthCount },
            { data: allResolvedChecks }
        ] = await Promise.all([
            admin.from("listings").select("id", { count: "exact", head: true }).lt("last_verified_at", oneYearAgo).is("is_active", true),
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "pending"),
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "pending").lt("response_deadline", now.toISOString()),
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("responded_at", startOfMonth),
            admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "deactivated").gte("created_at", startOfMonth),
            admin.from("annual_checks").select("check_date, responded_at").eq("status", "confirmed").not("responded_at", "is", null)
        ]);

        // Fix due count by subtracting active checks
        let actualDue = totalDueCount ?? 0;
        if (actualDue > 0) {
            // Check active counts for due listings
            const { count: activeDueChecks } = await admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "pending");
            actualDue = Math.max(0, actualDue - (activeDueChecks ?? 0));
        }

        let totalResponseDays = 0;
        let validResponseCount = 0;

        (allResolvedChecks ?? []).forEach(c => {
            if (c.check_date && c.responded_at) {
                const msDiff = new Date(c.responded_at).getTime() - new Date(c.check_date).getTime();
                const daysDiff = msDiff / (1000 * 60 * 60 * 24);
                if (daysDiff >= 0) {
                    totalResponseDays += daysDiff;
                    validResponseCount++;
                }
            }
        });

        const average_response_time_days = validResponseCount > 0 ? Number((totalResponseDays / validResponseCount).toFixed(1)) : 0;

        // response_rate_percent = (confirmed / (confirmed + ignored or deactivated overall))
        const { count: totalSent } = await admin.from("annual_checks").select("id", { count: "exact", head: true });
        const { count: totalConfirmed } = await admin.from("annual_checks").select("id", { count: "exact", head: true }).eq("status", "confirmed");
        
        const response_rate_percent = totalSent && totalSent > 0 
            ? Math.round(((totalConfirmed ?? 0) / (totalSent)) * 100) 
            : 0;

        return NextResponse.json({
            due_for_check: actualDue,
            pending_response: pendingCount ?? 0,
            past_deadline: pastDeadlineCount ?? 0,
            confirmed_this_month: confirmedMonthCount ?? 0,
            deactivated_this_month: deactivatedMonthCount ?? 0,
            average_response_time_days,
            response_rate_percent
        });
    } catch (err: any) {
        console.error("[admin/annual-checks/stats GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
