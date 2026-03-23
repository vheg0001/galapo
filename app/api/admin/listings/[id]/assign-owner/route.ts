import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function queueEmailIfAvailable(admin: ReturnType<typeof createAdminSupabaseClient>, payload: Record<string, any>) {
    const { error } = await admin.from("email_queue").insert(payload);
    if (error && error.code !== "42P01") {
        console.error("[admin/listings/[id]/assign-owner] email_queue insert failed", error);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const ownerId = String(body.owner_id ?? "").trim();
        if (!ownerId) {
            return NextResponse.json({ error: "owner_id is required." }, { status: 400 });
        }

        const [{ data: owner, error: ownerError }, { data: listing, error: listingError }] = await Promise.all([
            admin
                .from("profiles")
                .select("id, role, is_active")
                .eq("id", ownerId)
                .single(),
            admin
                .from("listings")
                .select("id, business_name")
                .eq("id", id)
                .single(),
        ]);

        if (ownerError || !owner) return NextResponse.json({ error: "Owner profile not found." }, { status: 404 });
        if (owner.role !== "business_owner" || !owner.is_active) {
            return NextResponse.json({ error: "owner_id must be an active business owner." }, { status: 400 });
        }
        if (listingError || !listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

        const now = new Date().toISOString();
        const { data: updated, error: updateError } = await admin
            .from("listings")
            .update({
                owner_id: ownerId,
                is_pre_populated: false,
                updated_at: now,
            })
            .eq("id", id)
            .select("*")
            .single();
        if (updateError) throw updateError;

        await admin.from("notifications").insert({
            user_id: ownerId,
            type: "claim_approved",
            title: "A listing has been assigned to you",
            message: `You can now manage "${listing.business_name}" in your dashboard.`,
            data: { listing_id: listing.id, listing_name: listing.business_name },
            is_read: false,
            created_at: now,
        });

        await queueEmailIfAvailable(admin, {
            user_id: ownerId,
            template: "owner_assigned_welcome",
            payload: { listing_id: listing.id, listing_name: listing.business_name },
            status: "queued",
            created_at: now,
            created_by: auth.userId,
        });

        return NextResponse.json({ listing: updated });
    } catch (error: any) {
        console.error("[admin/listings/[id]/assign-owner POST]", error);
        return NextResponse.json({ error: error.message ?? "Failed to assign owner" }, { status: 500 });
    }
}

