import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validatePassword } from "@/lib/auth-helpers";

// ──────────────────────────────────────────────────────────
// GalaPo — Reset Password Route Handler (Module 7.2)
// POST /api/auth/reset-password
// ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { new_password } = body;

        const passwordValidation = validatePassword(new_password);
        if (!passwordValidation.isValid) {
            return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // The user must already have a session established by the reset token in the URL
        const { data: userSessionData } = await supabase.auth.getSession();

        if (!userSessionData.session) {
            return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 401 });
        }

        const { error } = await supabase.auth.updateUser({
            password: new_password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
