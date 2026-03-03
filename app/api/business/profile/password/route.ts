import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * PUT /api/business/profile/password
 * Change user password
 */
export async function PUT(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { current_password, new_password } = await req.json();

        if (!current_password || !new_password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (new_password.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
        }

        // 1. Verify current password by attempting to sign in
        // Note: In Next.js App Router with @supabase/ssr, we use the user's email
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: current_password,
        });

        if (signInError) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
        }

        // 2. Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
            password: new_password,
        });

        if (updateError) throw updateError;

        return NextResponse.json({ message: "Password updated successfully" });
    } catch (error: any) {
        console.error("[PASSWORD_PUT]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
