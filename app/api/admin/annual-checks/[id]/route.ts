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

    const { action } = await request.json() as { action: "confirm" | "deactivate" | "extend" };

    if (!["confirm", "deactivate", "extend"].includes(action)) {
        return NextResponse.json({ error: "Invalid action. Use 'confirm', 'deactivate', or 'extend'." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();

    // Fetch the check and its listing
    const { data: check, error: fetchErr } = await admin
        .from("annual_checks")
        .select(`
            id, status, listing_id, response_deadline,
            listings!annual_checks_listing_id_fkey(id, business_name, owner_id, is_active)
        `)
        .eq("id", id)
        .single();

    if (fetchErr || !check) {
        return NextResponse.json({ error: "Annual check not found." }, { status: 404 });
    }

    const listing = (check as any).listings;
    const now = new Date();

    try {
        if (action === "confirm") {
            // Mark check as confirmed, update listing's last_verified_at
            const [checkUpdate, listingUpdate] = await Promise.all([
                admin.from("annual_checks").update({
                    status: "confirmed",
                    responded_at: now.toISOString(),
                }).eq("id", id),
                admin.from("listings").update({
                    last_verified_at: now.toISOString(),
                    updated_at: now.toISOString(),
                }).eq("id", check.listing_id),
            ]);
            if (checkUpdate.error) throw checkUpdate.error;
            if (listingUpdate.error) throw listingUpdate.error;

            return NextResponse.json({ success: true, action: "confirmed" });
        }

        if (action === "deactivate") {
            // Deactivate listing, update check to 'deactivated', create reactivation_fee record
            const [checkUpdate, listingUpdate] = await Promise.all([
                admin.from("annual_checks").update({ status: "deactivated" }).eq("id", id),
                admin.from("listings").update({ is_active: false, updated_at: now.toISOString() }).eq("id", check.listing_id),
            ]);
            if (checkUpdate.error) throw checkUpdate.error;
            if (listingUpdate.error) throw listingUpdate.error;

            // Create reactivation fee record
            await admin.from("reactivation_fees").insert({
                listing_id: check.listing_id,
                annual_check_id: id,
                status: "pending",
                created_at: now.toISOString(),
            });

            // Notify owner if registered
            if (listing?.owner_id) {
                await admin.from("notifications").insert({
                    user_id: listing.owner_id,
                    type: "listing_deactivated",
                    title: "Your listing has been deactivated",
                    message: `"${listing.business_name}" has been deactivated due to an unconfirmed annual check. To reactivate your listing, please pay the reactivation fee and contact support.`,
                    data: { listing_id: check.listing_id, listing_name: listing.business_name },
                    is_read: false,
                    created_at: now.toISOString(),
                });
            }

            return NextResponse.json({ success: true, action: "deactivated" });
        }

        // EXTEND — add 7 more days to response deadline
        const currentDeadline = new Date(check.response_deadline);
        currentDeadline.setDate(currentDeadline.getDate() + 7);
        const newDeadline = currentDeadline.toISOString().split("T")[0];

        const { error: extendErr } = await admin
            .from("annual_checks")
            .update({ response_deadline: newDeadline })
            .eq("id", id);

        if (extendErr) throw extendErr;

        // Notify the owner of the extension
        if (listing?.owner_id) {
            await admin.from("notifications").insert({
                user_id: listing.owner_id,
                type: "annual_check",
                title: "Annual check deadline extended",
                message: `Your deadline to confirm "${listing.business_name}" has been extended to ${newDeadline}. Please respond before this date.`,
                data: { listing_id: check.listing_id, listing_name: listing.business_name, new_deadline: newDeadline },
                is_read: false,
                created_at: now.toISOString(),
            });
        }

        return NextResponse.json({ success: true, action: "extended", new_deadline: newDeadline });
    } catch (err: any) {
        console.error("[admin/annual-checks/[id] PUT]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
