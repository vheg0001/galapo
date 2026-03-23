import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { ensureOwnedListing } from "@/lib/subscription-route-helpers";

/**
 * DELETE /api/business/top-search/[id]
 * Cancel an unfinished top search placement request owned by the authenticated user.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ("error" in auth) return auth.error;
    const { profile } = auth;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { data: placement, error: placementError } = await admin
            .from("top_search_placements")
            .select("id, listing_id, payment_id, is_active")
            .eq("id", id)
            .single();

        if (placementError) throw placementError;
        if (!placement) {
            return NextResponse.json({ error: "Placement not found" }, { status: 404 });
        }

        await ensureOwnedListing(profile.id, placement.listing_id);

        if (placement.is_active) {
            return NextResponse.json(
                { error: "Only pending placement requests can be deleted." },
                { status: 409 }
            );
        }

        if (placement.payment_id) {
            const { data: payment, error: paymentError } = await admin
                .from("payments")
                .select("id, status, payment_proof_url")
                .eq("id", placement.payment_id)
                .eq("user_id", profile.id)
                .single();

            if (paymentError) throw paymentError;

            const hasProof =
                typeof payment?.payment_proof_url === "string" &&
                payment.payment_proof_url.trim().length > 0;

            if (!payment || payment.status !== "pending" || hasProof) {
                return NextResponse.json(
                    { error: "This placement can no longer be cancelled because it is already under review." },
                    { status: 409 }
                );
            }

            const { error: deletePaymentError } = await admin
                .from("payments")
                .delete()
                .eq("id", payment.id)
                .eq("user_id", profile.id);

            if (deletePaymentError) throw deletePaymentError;
        }

        const { error: deletePlacementError } = await admin
            .from("top_search_placements")
            .delete()
            .eq("id", placement.id)
            .eq("listing_id", placement.listing_id);

        if (deletePlacementError) throw deletePlacementError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.status) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        console.error("DELETE /api/business/top-search/[id] error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
