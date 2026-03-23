import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";
import { formatOperatingHours } from "@/lib/listing-helpers";

/**
 * POST /api/business/listings/[id]/draft
 * Save partial data for a listing as a draft
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

        const body = await req.json();
        const { dynamic_fields = [], ...draftData } = body;
        const supabase = await createServerSupabaseClient();

        // 1. Prepare draft payload
        const payload: any = {
            ...draftData,
            status: "draft",
            updated_at: new Date().toISOString()
        };

        if (draftData.operating_hours) {
            payload.operating_hours = formatOperatingHours(draftData.operating_hours);
        }

        // Remove protected fields
        delete payload.id;
        delete payload.owner_id;
        delete payload.created_at;

        // 2. Update listing
        const { data: listing, error: dbError } = await supabase
            .from("listings")
            .update(payload)
            .eq("id", id)
            .eq("owner_id", session.user.id)
            .select()
            .single();

        if (dbError) throw dbError;

        // 3. Update dynamic fields (upsert)
        if (dynamic_fields.length > 0) {
            for (const df of dynamic_fields) {
                await supabase
                    .from("listing_field_values")
                    .upsert({
                        listing_id: id,
                        field_id: df.field_id,
                        value: df.value,
                        updated_at: new Date().toISOString()
                    }, { onConflict: "listing_id,field_id" });
            }
        }

        return NextResponse.json(listing);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
