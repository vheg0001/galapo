import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const supabase = await createServerSupabaseClient();
        const url = new URL(req.url);
        const q = url.searchParams.get("q");

        if (!q || q.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const { data, error } = await supabase
            .from("listings")
            .select("id, business_name, slug")
            .ilike("business_name", `%${q}%`)
            .eq("status", "approved")
            .limit(10);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Listing search error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
