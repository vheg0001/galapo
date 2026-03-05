import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type BulkAction = "approve" | "reject" | "activate" | "deactivate" | "delete";

function messageFor(action: BulkAction, listingName: string, reason?: string) {
    if (action === "approve") {
        return {
            type: "listing_approved",
            title: "Listing approved",
            message: `"${listingName}" has been approved and is now live.`,
            data: { listing_name: listingName, include_premium_ad: true },
        };
    }
    if (action === "reject") {
        return {
            type: "listing_rejected",
            title: "Listing rejected",
            message: `"${listingName}" was rejected. Reason: ${reason ?? "No reason provided."}`,
            data: { listing_name: listingName, reason: reason ?? null },
        };
    }
    if (action === "activate") {
        return {
            type: "listing_approved",
            title: "Listing activated",
            message: `"${listingName}" has been activated.`,
            data: { listing_name: listingName },
        };
    }
    if (action === "deactivate") {
        return {
            type: "listing_deactivated",
            title: "Listing deactivated",
            message: `"${listingName}" has been deactivated.`,
            data: { listing_name: listingName },
        };
    }
    return {
        type: "listing_deactivated",
        title: "Listing removed",
        message: `"${listingName}" was removed from active listings.`,
        data: { listing_name: listingName },
    };
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const listingIds = Array.isArray(body.listing_ids) ? body.listing_ids.filter(Boolean) : [];
        const action = String(body.action ?? "") as BulkAction;
        const reason = String(body.reason ?? "").trim();

        const allowed: BulkAction[] = ["approve", "reject", "activate", "deactivate", "delete"];
        if (!listingIds.length) {
            return NextResponse.json({ error: "listing_ids is required." }, { status: 400 });
        }
        if (!allowed.includes(action)) {
            return NextResponse.json({ error: "Unsupported bulk action." }, { status: 400 });
        }
        if (action === "reject" && !reason) {
            return NextResponse.json({ error: "reason is required for rejection." }, { status: 400 });
        }

        let successCount = 0;
        let failedCount = 0;
        const errors: { listing_id: string; error: string }[] = [];

        for (const listingId of listingIds) {
            try {
                const { data: listing, error: listingError } = await admin
                    .from("listings")
                    .select("id, business_name, owner_id")
                    .eq("id", listingId)
                    .single();

                if (listingError || !listing) {
                    throw new Error("Listing not found.");
                }

                const updates: Record<string, any> = { updated_at: new Date().toISOString() };
                if (action === "approve") {
                    updates.status = "approved";
                    updates.last_verified_at = new Date().toISOString();
                    updates.rejection_reason = null;
                } else if (action === "reject") {
                    updates.status = "rejected";
                    updates.rejection_reason = reason;
                } else if (action === "activate") {
                    updates.is_active = true;
                } else if (action === "deactivate" || action === "delete") {
                    updates.is_active = false;
                }

                const { error: updateError } = await admin.from("listings").update(updates).eq("id", listingId);
                if (updateError) throw updateError;

                if (listing.owner_id) {
                    const notif = messageFor(action, listing.business_name, reason);
                    const { error: notifError } = await admin.from("notifications").insert({
                        user_id: listing.owner_id,
                        type: notif.type,
                        title: notif.title,
                        message: notif.message,
                        data: { ...notif.data, listing_id: listing.id },
                        is_read: false,
                        created_at: new Date().toISOString(),
                    });
                    if (notifError) {
                        console.error("[admin/listings/bulk] notification insert failed", notifError);
                    }
                }

                successCount += 1;
            } catch (error: any) {
                failedCount += 1;
                errors.push({ listing_id: listingId, error: error.message ?? "Bulk item failed." });
            }
        }

        return NextResponse.json({
            success_count: successCount,
            failed_count: failedCount,
            errors,
        });
    } catch (error: any) {
        console.error("[admin/listings/bulk POST]", error);
        return NextResponse.json({ error: error.message ?? "Bulk action failed" }, { status: 500 });
    }
}

