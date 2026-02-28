import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────
// GalaPo — Login Route Handler (Module 7.2)
// POST /api/auth/login
// ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // 1. Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }

        if (!data.user) {
            return NextResponse.json({ error: "Login failed." }, { status: 401 });
        }

        // 2. Fetch Profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (profileError || !profile) {
            await supabase.auth.signOut();
            return NextResponse.json({ error: "Profile not found." }, { status: 404 });
        }

        // 3. Authorization Checks
        if (profile.role !== "business_owner" && profile.role !== "super_admin") {
            // Sign out the user immediately if they do not have the right role
            await supabase.auth.signOut();
            return NextResponse.json({ error: "Unauthorized access. This area is for business owners." }, { status: 403 });
        }

        if (!profile.is_active) {
            await supabase.auth.signOut();
            return NextResponse.json({ error: "Account is disabled. Please contact support." }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            user: data.user,
            profile,
            session: data.session
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
