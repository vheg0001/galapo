import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/business/profile
 * Fetch current authenticated user's profile
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: dbError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (dbError) throw dbError;

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error("[PROFILE_GET]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PUT /api/business/profile
 * Update profile information
 */
export async function PUT(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { full_name, phone, avatar_url, notification_preferences } = body;

        // Validation
        if (!full_name || full_name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Basic phone validation if provided
        if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) {
            return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
        }

        const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({
                full_name: full_name.trim(),
                phone: phone ? phone.trim() : null,
                avatar_url,
                notification_preferences,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json(updatedProfile);
    } catch (error: any) {
        console.error("[PROFILE_PUT]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
