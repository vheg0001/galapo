import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────
// GalaPo — Logout Route Handler (Module 7.2)
// POST /api/auth/logout
// ──────────────────────────────────────────────────────────

export async function POST() {
    try {
        const supabase = await createServerSupabaseClient();

        // Sign out clear the session cookies internally in Supabase SSR
        const { error } = await supabase.auth.signOut();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
