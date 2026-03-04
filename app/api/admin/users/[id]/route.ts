import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();
        const [{ data: profile }, { data: listings }, { data: sub }] = await Promise.all([
            admin.from("profiles").select("*").eq("id", id).single(),
            admin.from("listings").select("id, business_name, slug, status, created_at, is_active, is_premium, is_featured")
                .eq("owner_id", id).order("created_at", { ascending: false }),
            admin.from("subscriptions").select("id, plan_type, status, starts_at, ends_at")
                .eq("user_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

        if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json({ profile, listings: listings ?? [], subscription: sub });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PUT /api/admin/users/[id] ────────────────────────────────────────────────
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    // Prevent self-deactivation
    if (id === auth.userId) {
        return NextResponse.json({ error: "Cannot modify your own admin account." }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (["business_owner", "super_admin"].includes(body.role)) updates.role = body.role;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    try {
        const admin = createAdminSupabaseClient();
        const { data, error } = await admin
            .from("profiles")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ profile: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
