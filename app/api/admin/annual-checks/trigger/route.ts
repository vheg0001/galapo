import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { listing_id } = await request.json();
    if (!listing_id) {
        return NextResponse.json({ error: "listing_id is required." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    // Verify listing exists and is active
    const { data: listing } = await admin
        .from("listings")
        .select("id, business_name, owner_id, is_active")
        .eq("id", listing_id)
        .single();

    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

    // Check for an already-active check
    const { data: existing } = await admin
        .from("annual_checks")
        .select("id, status")
        .eq("listing_id", listing_id)
        .in("status", ["pending"])
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ error: "An active annual check already exists for this listing." }, { status: 409 });
    }

    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 14); // 14-day response window

    try {
        // Create check record
        const { data: check, error } = await admin
            .from("annual_checks")
            .insert({
                listing_id,
                status: "pending",
                sent_at: now.toISOString(),
                response_deadline: deadline.toISOString().split("T")[0],
                created_at: now.toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        // Update listing last_verified_at tracking
        await admin.from("listings").update({ updated_at: now.toISOString() }).eq("id", listing_id);

        // Notify owner (if registered)
        if (listing.owner_id) {
            await admin.from("notifications").insert({
                user_id: listing.owner_id,
                type: "annual_check",
                title: "Annual Listing Check — Action Required",
                message: `We need to verify that "${listing.business_name}" is still active. Please confirm your listing before ${deadline.toDateString()} to keep it active on GalaPo.`,
                data: { listing_id, listing_name: listing.business_name, check_id: check.id },
                is_read: false,
                created_at: now.toISOString(),
            });
        }

        return NextResponse.json({ success: true, check });
    } catch (err: any) {
        console.error("[admin/annual-checks/trigger POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
