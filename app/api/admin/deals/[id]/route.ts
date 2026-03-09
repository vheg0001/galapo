import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();
    try {
        const { data, error } = await supabase
            .from("deals")
            .select(`
                *,
                listings (
                    *,
                    category:categories!listings_category_id_fkey (*),
                    barangay:barangays (*),
                    owner:profiles (*)
                )
            `)
            .eq("id", params.id)
            .single();

        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = await createServerSupabaseClient();
    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from("deals")
            .update(body)
            .eq("id", params.id)
            .select()
            .single();

        if (error) throw error;
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
    try {
        const { error } = await supabase
            .from("deals")
            .delete()
            .eq("id", params.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
