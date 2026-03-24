import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

/**
 * GET /api/admin/invoices
 * Lists all invoices for admin management.
 */
export async function GET(request: NextRequest) {
    try {
        await requireAdmin(request);
        const searchParams = request.nextUrl.searchParams;
        
        const search = searchParams.get("search");
        const fromDate = searchParams.get("date_from");
        const toDate = searchParams.get("date_to");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;

        const supabase = createAdminSupabaseClient();
        
        let query = supabase
            .from("invoices")
            .select(`
                *,
                profiles:user_id (id, full_name, email),
                listings:listing_id (id, business_name, slug),
                payments:payment_id (id, payment_method, reference_number)
            `, { count: "exact" });

        if (fromDate) {
            query = query.gte("issued_at", fromDate);
        }
        if (toDate) {
            query = query.lte("issued_at", toDate);
        }
        if (search) {
            query = query.or(`invoice_number.ilike.%${search}%,description.ilike.%${search}%`);
        }

        query = query.order("issued_at", { ascending: false });
        query = query.range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) throw error;

        return NextResponse.json({
            invoices: data,
            total: count || 0,
            page,
            limit
        });

    } catch (error: any) {
        console.error("GET /api/admin/invoices error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
