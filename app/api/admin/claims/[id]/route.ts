import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();
    try {
        const { data: listing, error } = await admin
            .from("listings")
            .select(`
                id, business_name, slug, status, claim_proof_url, claimed_at, created_at, is_pre_populated,
                categories!listings_category_id_fkey(name),
                profiles!listings_owner_id_fkey(id, full_name, email, phone)
            `)
            .eq("id", id)
            .single();

        if (error || !listing) {
            return NextResponse.json({ error: "Claim listing not found." }, { status: 404 });
        }

        let finalClaimant = (listing as any).profiles ?? null;
        let finalProofUrl = listing.claim_proof_url;
        let finalReason = null;

        // Fetch historical data from notifications if needed (especially for rejected/approved claims)
        const { data: notifications } = await admin
            .from("notifications")
            .select(`
                user_id,
                data,
                profiles!notifications_user_id_fkey(id, full_name, email, phone)
            `)
            .in("type", ["claim_rejected", "claim_approved", "new_claim_request"])
            .filter("data->>listing_id", "eq", id)
            .order("created_at", { ascending: false });

        if (notifications && notifications.length > 0) {
            // Traverse notifications to find the best available data
            for (const n of notifications) {
                if (!finalClaimant) finalClaimant = (n as any).profiles ?? null;
                if (!finalProofUrl) finalProofUrl = (n.data as any)?.proof_url ?? (n.data as any)?.claim_proof_url ?? null;
                if (!finalReason) finalReason = (n.data as any)?.reason ?? null;
            }
        }

        return NextResponse.json({
            id: listing.id,
            listing_name: listing.business_name,
            slug: listing.slug,
            status: listing.status,
            claim_proof_url: finalProofUrl,
            proof_url: finalProofUrl, // Duplicated to match list view naming just in case
            rejection_reason: finalReason,
            claimed_at: listing.claimed_at,
            created_at: listing.created_at,
            is_pre_populated: listing.is_pre_populated,
            category_name: (listing as any).categories?.name ?? "Uncategorized",
            claimant: finalClaimant,
        });
    } catch (err: any) {
        console.error("[admin/claims/[id] GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

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
        .select("id, business_name, owner_id, status, claim_proof_url")
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
                data: {
                    listing_id: listing.id,
                    listing_name: listing.business_name,
                    proof_url: listing.claim_proof_url
                },
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
                // We keep claim_proof_url for historical/audit reference in the admin panel
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
            data: {
                listing_id: listing.id,
                listing_name: listing.business_name,
                reason: rejectReason,
                proof_url: listing.claim_proof_url // Save it here too just in case
            },
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // This is the listing ID
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("notification_id");

    const admin = createAdminSupabaseClient();

    // Helper to extract storage path from URL
    const getStoragePath = (url: string | null | undefined) => {
        if (!url) return null;
        try {
            // URL format: .../storage/v1/object/public/claims/PATH_HERE
            if (url.includes("/public/claims/")) {
                return url.split("/public/claims/")[1];
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    try {
        // If a specific notification ID is provided, delete that record (history removal)
        if (notificationId) {
            // 1. Fetch notification to get proof URL
            const { data: notification } = await admin
                .from("notifications")
                .select("data")
                .eq("id", notificationId)
                .single();

            const proofUrl = notification?.data?.proof_url || notification?.data?.claim_proof_url;
            const storagePath = getStoragePath(proofUrl);

            // 2. Cleanup storage if path exists
            if (storagePath) {
                await admin.storage.from("claims").remove([storagePath]);
            }

            // 3. Delete notification
            const { error: deleteErr } = await admin
                .from("notifications")
                .delete()
                .eq("id", notificationId);

            if (deleteErr) throw deleteErr;

            return NextResponse.json({ success: true, message: "History record and storage file deleted." });
        }

        // Otherwise, reset the claim status for the listing (effectively canceling a claim)
        const { data: listing, error: fetchErr } = await admin
            .from("listings")
            .select("status, claim_proof_url")
            .eq("id", id)
            .single();

        if (fetchErr || !listing) {
            return NextResponse.json({ error: "Listing not found." }, { status: 404 });
        }

        const storagePath = getStoragePath(listing.claim_proof_url);

        // 1. Cleanup storage if path exists
        if (storagePath) {
            await admin.storage.from("claims").remove([storagePath]);
        }

        // 2. Revert listing to public approved
        const { error: updateErr } = await admin
            .from("listings")
            .update({
                status: "approved",
                owner_id: null,
                claim_proof_url: null,
                claimed_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (updateErr) throw updateErr;

        // 3. Cleanup any "new_claim_request" notifications for this listing
        // We also try to delete storage from those notifications if they have different URLs
        const { data: pendingNotifs } = await admin
            .from("notifications")
            .select("data")
            .eq("type", "new_claim_request")
            .filter("data->>listing_id", "eq", id);

        if (pendingNotifs) {
            const pathsToCleanup = pendingNotifs
                .map(n => getStoragePath(n.data?.claim_proof_url || n.data?.proof_url))
                .filter((p): p is string => p !== null && p !== storagePath); // Avoid double delete

            if (pathsToCleanup.length > 0) {
                await admin.storage.from("claims").remove(pathsToCleanup);
            }
        }

        await admin
            .from("notifications")
            .delete()
            .eq("type", "new_claim_request")
            .filter("data->>listing_id", "eq", id);

        return NextResponse.json({ success: true, message: "Claim request removed, listing reset, and storage files cleaned up." });
    } catch (err: any) {
        console.error("[admin/claims/[id] DELETE]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
