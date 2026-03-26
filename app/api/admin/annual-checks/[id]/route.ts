import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();
        const { data: check, error } = await admin
            .from("annual_checks")
            .select(`
                id, listing_id, status, check_date, response_deadline, responded_at, created_at,
                listings!inner(id, business_name, slug, owner_id, last_verified_at, is_active, profiles!listings_owner_id_fkey(id, full_name, email))
            `)
            .eq("id", id)
            .single();

        if (error) throw error;

        // Fetch check history for this listing
        const { data: history } = await admin
            .from("annual_checks")
            .select("*")
            .eq("listing_id", check.listing_id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            ...check,
            owner: (check.listings as any)?.profiles ?? null,
            listing: check.listings,
            history: history ?? []
        });
    } catch (err: any) {
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

    const { action } = await request.json() as { action: "confirm" | "deactivate" | "extend" | "send_reminder" };

    if (!["confirm", "deactivate", "extend", "send_reminder"].includes(action)) {
        return NextResponse.json({ error: "Invalid action. Use 'confirm', 'deactivate', 'extend', or 'send_reminder'." }, { status: 400 });
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

            if (listing?.owner_id) {
                await admin.from("notifications").insert({
                    user_id: listing.owner_id,
                    type: "annual_check_confirmed",
                    title: "Annual Check Confirmed",
                    message: `Your listing "${listing.business_name}" has been verified for another year.`,
                    data: { listing_id: check.listing_id, check_id: id },
                    created_at: now.toISOString(),
                });
            }

            return NextResponse.json({ success: true, action: "confirmed" });
        }

        if (action === "deactivate") {
            const [checkUpdate, listingUpdate] = await Promise.all([
                admin.from("annual_checks").update({ status: "deactivated" }).eq("id", id),
                admin.from("listings").update({ is_active: false, updated_at: now.toISOString() }).eq("id", check.listing_id),
            ]);
            if (checkUpdate.error) throw checkUpdate.error;
            if (listingUpdate.error) throw listingUpdate.error;

            // Generate reactivation fee (Assume config stored in DB or 500 default)
            await admin.from("reactivation_fees").insert({
                listing_id: check.listing_id,
                annual_check_id: id,
                status: "pending",
                created_at: now.toISOString(),
            });

            // Cancel active subs
            await admin.from("subscriptions").update({ status: "cancelled", end_date: now.toISOString() })
                 .eq("listing_id", check.listing_id).eq("status", "active");

            if (listing?.owner_id) {
                await admin.from("notifications").insert({
                    user_id: listing.owner_id,
                    type: "listing_deactivated",
                    title: "Listing Deactivated",
                    message: `"${listing.business_name}" has been deactivated. A reactivation fee is required to restore it.`,
                    data: { listing_id: check.listing_id, check_id: id },
                    created_at: now.toISOString(),
                });
            }

            return NextResponse.json({ success: true, action: "deactivated" });
        }

        if (action === "extend") {
            const currentDeadline = new Date(check.response_deadline);
            currentDeadline.setDate(currentDeadline.getDate() + 7);
            const newDeadline = currentDeadline.toISOString().split("T")[0];

            const { error: extendErr } = await admin
                .from("annual_checks")
                .update({ response_deadline: newDeadline })
                .eq("id", id);
            if (extendErr) throw extendErr;

            if (listing?.owner_id) {
                await admin.from("notifications").insert({
                    user_id: listing.owner_id,
                    type: "annual_check",
                    title: "Annual Check Extended",
                    message: `You have 7 more days to confirm your listing "${listing.business_name}".`,
                    data: { listing_id: check.listing_id, new_deadline: newDeadline },
                    created_at: now.toISOString(),
                });
            }
            return NextResponse.json({ success: true, action: "extended", new_deadline: newDeadline });
        }

        if (action === "send_reminder") {
            // Re-send notification
            if (listing?.owner_id) {
                await admin.from("notifications").insert({
                    user_id: listing.owner_id,
                    type: "annual_check_reminder",
                    title: "Reminder: Annual Check Due",
                    message: `Please respond to the annual check for "${listing.business_name}" by ${check.response_deadline}.`,
                    data: { listing_id: check.listing_id, check_id: id },
                    created_at: now.toISOString(),
                });
                
                await admin.from("admin_user_notes").insert({
                    user_id: listing.owner_id,
                    admin_id: auth.user.id,
                    note: `[REMINDER SENT] Annual check reminder for listing ${listing.business_name}`
                });
            }
            return NextResponse.json({ success: true, action: "reminder_sent" });
        }

    } catch (err: any) {
        console.error(`[admin/annual-checks/[id] PUT - ${action}]`, err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
