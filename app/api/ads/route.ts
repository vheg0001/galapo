import { NextResponse } from "next/server";
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
