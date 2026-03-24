import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const { data, error } = await admin
            .from("static_pages")
            .select("id, title, slug, is_published, meta_title, meta_description, sort_order, created_at, updated_at")
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const { title, slug, content, meta_title, meta_description, is_published, sort_order } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: "Title and slug are required." }, { status: 400 });
        }

        const { data, error } = await admin.from("static_pages").insert({
            title,
            slug,
            content: content || "<p></p>",
            meta_title: meta_title || null,
            meta_description: meta_description || null,
            is_published: is_published ?? false,
            sort_order: sort_order ?? 0,
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
