import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString();

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
            .eq("id", params.id)
            .eq("is_active", true)
            .gte("end_date", today)
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
