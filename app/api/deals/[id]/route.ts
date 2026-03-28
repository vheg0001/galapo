import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { addMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const nowIso = now.toISOString();
    const oneMonthFromNow = addMonths(now, 1).toISOString();

    try {
        const { data, error } = await supabase
            .from("deals")
            .select(`
                *,
                listing:listings (
                    *,
                    category:categories!listings_category_id_fkey (*),
                    barangay:barangays (*),
                    listing_badges (
                        id,
                        badge:badges (*)
                    ),
                    listing_images (*)
                )
            `)
            .eq("id", id)
            .eq("is_active", true)
            .gte("end_date", nowIso)
            .lte("start_date", oneMonthFromNow)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({ error: "Deal not found or expired" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[api/deals/[id] GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
