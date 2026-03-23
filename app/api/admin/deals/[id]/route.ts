import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { simplifyError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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
            .eq("id", id)
            .single();

        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: simplifyError(error) }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from("deals")
            .update(body)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: simplifyError(error) }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    try {
        const { error } = await supabase
            .from("deals")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: simplifyError(error) }, { status: 500 });
    }
}
