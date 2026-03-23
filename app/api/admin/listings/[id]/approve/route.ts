import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function queueEmailIfAvailable(admin: ReturnType<typeof createAdminSupabaseClient>, payload: Record<string, any>) {
    const { error } = await admin.from("email_queue").insert(payload);
    if (error && error.code !== "42P01") {
        console.error("[admin/listings/[id]/approve] email_queue insert failed", error);
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
        const { data: listing, error: fetchError } = await admin
            .from("listings")
            .select("id, status, owner_id, business_name")
            .eq("id", id)
            .single();

        if (fetchError || !listing) {
            return NextResponse.json({ error: "Listing not found." }, { status: 404 });
        }
        if (!["pending", "claimed_pending"].includes(listing.status)) {
            return NextResponse.json({ error: "Only pending listings can be approved." }, { status: 409 });
        }

        const now = new Date().toISOString();
        const { data: updated, error: updateError } = await admin
            .from("listings")
            .update({
                status: "approved",
                last_verified_at: now,
                rejection_reason: null,
                updated_at: now,
            })
            .eq("id", id)
            .select("*")
            .single();
        if (updateError) throw updateError;

        if (listing.owner_id) {
            await admin.from("notifications").insert({
                user_id: listing.owner_id,
                type: "listing_approved",
                title: "Your listing has been approved!",
                message: `"${listing.business_name}" is now approved and live.`,
                data: { listing_id: listing.id, listing_name: listing.business_name, include_premium_ad: true },
                is_read: false,
                created_at: now,
            });

            await queueEmailIfAvailable(admin, {
                user_id: listing.owner_id,
                template: "listing_approved_with_premium_ad",
                payload: {
                    listing_id: listing.id,
                    listing_name: listing.business_name,
                },
                status: "queued",
                created_at: now,
                created_by: auth.userId,
            });
        }

        return NextResponse.json({ listing: updated });
    } catch (error: any) {
        console.error("[admin/listings/[id]/approve POST]", error);
        return NextResponse.json({ error: error.message ?? "Failed to approve listing" }, { status: 500 });
    }
}

