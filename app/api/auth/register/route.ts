import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateEmail, validatePassword, validatePhone } from "@/lib/auth-helpers";

// ──────────────────────────────────────────────────────────
// GalaPo — Register Route Handler (Module 7.2)
// POST /api/auth/register
// ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, full_name, phone } = body;

        // ── Validation ──────────────────────────────────────────

        if (!email || !validateEmail(email)) {
            return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
        }

        if (!full_name || full_name.trim().length < 2) {
            return NextResponse.json({ error: "Full name must be at least 2 characters." }, { status: 400 });
        }

        if (!phone || !validatePhone(phone)) {
            return NextResponse.json({ error: "Invalid Philippine phone number format." }, { status: 400 });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
        }

        // ── Create Auth User ────────────────────────────────────

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    role: "business_owner",
                },
            },
        });

        if (error) {
            // Check for specific error types
            if (error.message.includes("User already registered") || error.message.includes("already exists")) {
                return NextResponse.json({ error: "Email already exists." }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Wait a small bit for DB triggers to complete before querying the profile
        if (data.user) {
            // The existing trigger in DB should create the profile. Let's update it with specific details.
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    full_name,
                    phone,
                    role: "business_owner"
                })
                .eq("id", data.user.id);

            if (profileError) {
                console.error("Error updating newly created profile:", profileError);
                // Non-fatal, return success anyway but log the issue
            }

            // Fetch updated profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();

            return NextResponse.json(
                {
                    success: true,
                    user: data.user,
                    profile,
                    session: data.session
                },
                { status: 201 }
            );
        }

        return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
