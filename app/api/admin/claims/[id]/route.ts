import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const { action, reason } = body as { action: "approve" | "reject"; reason?: string };

    if (!["approve", "reject"].includes(action)) {
        return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    // Fetch the listing that is being claimed (id = listing id)
    const { data: listing, error: fetchErr } = await admin
        .from("listings")
        .select("id, business_name, owner_id, status")
        .eq("id", id)
        .single();

    if (fetchErr || !listing) {
        return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.status !== "claimed_pending") {
        return NextResponse.json({ error: "This listing is not in a claimed_pending state." }, { status: 409 });
    }

    if (!listing.owner_id) {
        return NextResponse.json({ error: "No claimant found for this listing." }, { status: 400 });
    }

    try {
        if (action === "approve") {
            // 1. Set listing ownership and status
            const { error: updateErr } = await admin
                .from("listings")
                .update({
                    status: "approved",
                    claimed_at: new Date().toISOString(),
                    is_pre_populated: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id);

            if (updateErr) throw updateErr;

            // 2. Notify claimant
            await admin.from("notifications").insert({
                user_id: listing.owner_id,
                type: "claim_approved",
                title: "Your claim has been approved! 🎉",
                message: `Congratulations! Your claim for "${listing.business_name}" has been approved. You can now manage your listing and upgrade to a premium plan for more benefits.`,
                data: { listing_id: listing.id, listing_name: listing.business_name },
                is_read: false,
                created_at: new Date().toISOString(),
            });

            return NextResponse.json({
                success: true,
                action: "approved",
                listing_id: id,
            });
        }

        // REJECT
        // 1. Revert listing to unclaimed public state
        const { error: revertErr } = await admin
            .from("listings")
            .update({
                status: "approved",
                owner_id: null,
                claim_proof_url: null,
                claimed_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (revertErr) throw revertErr;

        // 2. Notify claimant
        const rejectReason = reason || "The submitted proof did not meet our verification requirements.";
        await admin.from("notifications").insert({
            user_id: listing.owner_id,
            type: "claim_rejected",
            title: "Claim not approved",
            message: `Your claim for "${listing.business_name}" was not approved. Reason: ${rejectReason}. You may resubmit with additional documentation.`,
            data: { listing_id: listing.id, listing_name: listing.business_name, reason: rejectReason },
            is_read: false,
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            action: "rejected",
            listing_id: id,
        });
    } catch (err: any) {
        console.error("[admin/claims/[id] PUT]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
