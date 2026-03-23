import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const revalidate = 1800; // 30 minutes

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    try {
        const { data, error } = await supabase
            .from("static_pages")
            .select("id, title, slug, content, meta_title, meta_description, updated_at")
            .eq("slug", slug)
            .eq("is_published", true)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Page not found." }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
