import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/business/invoices
 * Lists invoices for the authenticated business owner.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const supabaseAdmin = (await import("@/lib/supabase")).createAdminSupabaseClient();
        
        let query = supabaseAdmin
            .from("invoices")
            .select(`
                *,
                listings:listing_id (id, business_name, slug),
                payments:payment_id (id, status, payment_method, reference_number, subscriptions(plan_type))
            `, { count: "exact" })
            .eq("user_id", user.id)
            .order("issued_at", { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: invoices, count, error } = await query;
        if (error) throw error;

        return NextResponse.json({ 
            invoices,
            total: count || 0,
            page,
            limit
        });

    } catch (error: any) {
        console.error("GET /api/business/invoices error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
