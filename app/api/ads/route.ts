import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const { ad_id } = await request.json();

        if (!ad_id) {
            return NextResponse.json({ error: "ad_id is required" }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Call the RPC function to increment the impression count
        const { error } = await supabase.rpc("increment_ad_impression", { ad_id });

        if (error) {
            console.error("Failed to increment ad impression:", error);
            return NextResponse.json({ error: "Failed to increment impression" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error in /api/ads POST:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const location = searchParams.get("location");
        const position = Number(searchParams.get("position")) || 1;

        if (!location) {
            return NextResponse.json({ error: "location is required" }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const now = new Date().toISOString().split("T")[0];

        const { data: ad, error } = await supabase
            .from("ad_placements")
            .select("id, title, image_url, target_url")
            .eq("placement_location", location)
            .eq("is_active", true)
            .eq("is_adsense", false)
            .lte("start_date", now)
            .gte("end_date", now)
            .order("created_at", { ascending: false })
            .range((position - 1), (position - 1))
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({ data: ad });
    } catch (err: any) {
        console.error("Error in /api/ads GET:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
