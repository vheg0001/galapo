import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function validateOwnership(supabase: any, dealId: string, userId: string) {
    const { data: deal, error } = await supabase
        .from("deals")
        .select("*, listings(owner_id)")
        .eq("id", dealId)
        .single();

    if (error || !deal) return { error: "Deal not found", status: 404 };
    if (deal.listings.owner_id !== userId) return { error: "Unauthorized", status: 403 };

    return { deal };
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { deal, error, status } = await validateOwnership(supabase, params.id, session.user.id);
        if (error) return NextResponse.json({ error }, { status });

        return NextResponse.json({ data: deal });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { error, status } = await validateOwnership(supabase, params.id, session.user.id);
        if (error) return NextResponse.json({ error }, { status });

        const { data, error: updateError } = await supabase
            .from("deals")
            .update(body)
            .eq("id", params.id)
            .select()
            .single();

        if (updateError) throw updateError;
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { error, status } = await validateOwnership(supabase, params.id, session.user.id);
        if (error) return NextResponse.json({ error }, { status });

        const { error: deleteError } = await supabase
            .from("deals")
            .delete()
            .eq("id", params.id);

        if (deleteError) throw deleteError;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
