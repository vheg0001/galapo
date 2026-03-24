import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { data, error } = await admin
            .from("static_pages")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: "Page not found." }, { status: 404 });

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const allowed = ["title", "slug", "content", "meta_title", "meta_description", "is_published", "sort_order"];

        const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
        for (const key of allowed) {
            if (key in body) updatePayload[key] = body[key];
        }

        const { data, error } = await admin
            .from("static_pages")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT is an alias for PATCH
export const PUT = PATCH;

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { error } = await admin.from("static_pages").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
