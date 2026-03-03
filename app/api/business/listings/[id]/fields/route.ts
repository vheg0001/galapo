import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

/**
 * POST /api/business/listings/[id]/fields
 * Save dynamic field values for a listing
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fields } = await req.json();
        if (!fields || typeof fields !== "object") {
            return NextResponse.json({ error: "fields is required" }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Verify ownership
        const { data: listing, error: fetchError } = await supabase
            .from("listings")
            .select("id")
            .eq("id", id)
            .eq("owner_id", session.user.id)
            .single();

        if (fetchError || !listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // Upsert each field value
        const upserts = Object.entries(fields).map(([field_id, value]) => ({
            listing_id: id,
            field_id,
            value,
        }));

        if (upserts.length === 0) {
            return NextResponse.json({ success: true });
        }

        const { error: upsertError } = await supabase
            .from("listing_field_values")
            .upsert(upserts, {
                onConflict: "listing_id,field_id",
                ignoreDuplicates: false,
            });

        if (upsertError) throw upsertError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[LISTING_FIELDS_POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
