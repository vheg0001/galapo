import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
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
            .from("admin_notes")
            .select("id, note, created_at, admin_id, profiles!admin_notes_admin_id_fkey(full_name, email)")
            .eq("listing_id", id)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json({ notes: data ?? [] });
    } catch (error: any) {
        console.error("[admin/listings/[id]/notes GET]", error);
        return NextResponse.json({ error: error.message ?? "Failed to load notes" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const note = String(body.note ?? "").trim();
        if (!note) return NextResponse.json({ error: "Note is required" }, { status: 400 });

        const { data, error } = await admin
            .from("admin_notes")
            .insert({
                listing_id: id,
                admin_id: auth.userId,
                note,
            })
            .select("id, note, created_at, admin_id, profiles!admin_notes_admin_id_fkey(full_name, email)")
            .single();
        if (error) throw error;
        return NextResponse.json({ note: data }, { status: 201 });
    } catch (error: any) {
        console.error("[admin/listings/[id]/notes POST]", error);
        return NextResponse.json({ error: error.message ?? "Failed to add note" }, { status: 500 });
    }
}
