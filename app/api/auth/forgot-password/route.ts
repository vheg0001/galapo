import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEmail } from "@/lib/auth-helpers";

// ──────────────────────────────────────────────────────────
// GalaPo — Forgot Password Route Handler (Module 7.2)
// POST /api/auth/forgot-password
// ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !validateEmail(email)) {
            return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Use request.nextUrl.origin to dynamically get the base URL
        const resetUrl = `${request.nextUrl.origin}/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: resetUrl,
        });

        if (error) {
            // If it's a rate limit error it's safe to surface it
            if (error.status === 429) {
                return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
            }
            // For other errors, we might want to log it internally but still return success to the client
            // to prevent email enumeration attacks. We'll simply log it.
            console.error("Reset password error:", error.message);
        }

        // Always return success for security (prevent email enumeration)
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
