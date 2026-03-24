import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";
import { PaymentStatus } from "@/lib/types";

/**
 * GET /api/admin/payments
 * Lists and filters payments for admin verification dashboard.
 */
export async function GET(request: NextRequest) {
    try {
        await requireAdmin(request);
        const searchParams = request.nextUrl.searchParams;
        
        const status = searchParams.get("status") || "all";
        const fromDate = searchParams.get("date_from");
        const toDate = searchParams.get("date_to");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;

        const supabase = createAdminSupabaseClient();
        
        // 1. Build main query
        let query = supabase
            .from("payments")
            .select(`
                *,
                profiles:user_id (id, full_name, email),
                listings:listing_id (id, business_name, slug),
                subscriptions:subscription_id (id, plan_type, status),
                invoices (id, invoice_number)
            `, { count: "exact" });

        // Apply filters
        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        if (fromDate) {
            query = query.gte("created_at", fromDate);
        }

        if (toDate) {
            query = query.lte("created_at", toDate);
        }

        if (search) {
            query = query.or(`reference_number.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Sort by newest first
        query = query.order("created_at", { ascending: false });

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) throw error;

        // 2. Get status counts for tabs
        const { data: statusCounts } = await supabase
            .rpc("get_payment_status_counts"); 
        
        // Fallback if RPC not available
        let counts = statusCounts;
        if (!statusCounts) {
            const statuses = ["pending", "verified", "rejected"];
            const countPromises = statuses.map(s => 
                supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", s)
            );
            const results = await Promise.all(countPromises);
            counts = {
                pending: results[0].count || 0,
                verified: results[1].count || 0,
                rejected: results[2].count || 0,
                all: (results[0].count || 0) + (results[1].count || 0) + (results[2].count || 0)
            };
        }

        return NextResponse.json({
            payments: data,
            total: count || 0,
            counts,
            page,
            limit
        });

    } catch (error: any) {
        console.error("GET /api/admin/payments error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
