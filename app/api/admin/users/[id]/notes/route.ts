import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();
        const { data: notes, error } = await admin
            .from("admin_user_notes")
            .select("id, note, created_at, admin_id, profiles!admin_user_notes_admin_id_fkey(full_name)")
            .eq("user_id", id)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json(notes);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { note } = await request.json();
        if (!note || note.trim().length === 0) {
            return NextResponse.json({ error: "Note is required" }, { status: 400 });
        }

        const admin = createAdminSupabaseClient();
        const { data, error } = await admin
            .from("admin_user_notes")
            .insert({
                user_id: id,
                admin_id: auth.user.id,
                note: note.trim()
            })
            .select("id, note, created_at, admin_id, profiles!admin_user_notes_admin_id_fkey(full_name)")
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
