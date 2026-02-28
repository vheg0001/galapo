import { NextRequest, NextResponse } from "next/server";
import { getServerProfile, getServerSession, validatePhone } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────
// GalaPo — Profile Route Handler (Module 7.2)
// GET /api/auth/profile
// PUT /api/auth/profile
// ──────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const profile = await getServerProfile();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found or not authenticated." }, { status: 404 });
        }

        return NextResponse.json({ profile });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch profile." }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const body = await request.json();
        const { full_name, phone, avatar_url } = body;

        // Validation
        const updates: any = {};

        if (full_name !== undefined) {
            if (full_name.trim().length < 2) {
                return NextResponse.json({ error: "Full name must be at least 2 characters." }, { status: 400 });
            }
            updates.full_name = full_name;
        }

        if (phone !== undefined) {
            if (!validatePhone(phone)) {
                return NextResponse.json({ error: "Invalid Philippine phone number format." }, { status: 400 });
            }
            updates.phone = phone;
        }

        if (avatar_url !== undefined) {
            updates.avatar_url = avatar_url;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No fields to update." }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const { data: updatedProfile, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", session.user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: updatedProfile });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
    }
}
