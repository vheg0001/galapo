import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { canCreateDeal } from "@/lib/deal-helpers";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { start_date, end_date } = body;

        if (!start_date || !end_date) {
            return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
        }

        // 1. Get original deal and validate owner
        const { data: original, error: fetchError } = await supabase
            .from("deals")
            .select("*, listings(owner_id)")
            .eq("id", id)
            .single();

        if (fetchError || !original) return NextResponse.json({ error: "Original deal not found" }, { status: 404 });
        if (original.listings.owner_id !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        // 2. Check limits before duplicating
        const check = await canCreateDeal(supabase, original.listing_id, session.user.id);
        if (!check.allowed) return NextResponse.json({ error: check.reason }, { status: 403 });

        // 3. Create Duplicate
        const { data: duplicate, error: duplicateError } = await supabase
            .from("deals")
            .insert({
                listing_id: original.listing_id,
                title: original.title,
                description: original.description,
                image_url: original.image_url,
                discount_text: original.discount_text,
                start_date: new Date(start_date).toISOString(),
                end_date: new Date(end_date).toISOString(),
                terms_conditions: original.terms_conditions,
                is_active: true
            })
            .select()
            .single();

        if (duplicateError) throw duplicateError;

        return NextResponse.json({ data: duplicate });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
