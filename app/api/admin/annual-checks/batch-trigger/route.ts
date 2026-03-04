import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    try {
        // Find listings that haven't been verified in over 1 year and are still active
        const { data: listings, error: listingErr } = await admin
            .from("listings")
            .select("id, business_name, owner_id, last_verified_at")
            .eq("is_active", true)
            .in("status", ["approved", "claimed_pending"])
            .or(`last_verified_at.is.null,last_verified_at.lt.${oneYearAgo.toISOString()}`);

        if (listingErr) throw listingErr;
        if (!listings || listings.length === 0) {
            return NextResponse.json({ triggered_count: 0, message: "No listings require annual checks at this time." });
        }

        // Find which already have a pending check
        const listingIds = listings.map((l: any) => l.id);
        const { data: existingChecks } = await admin
            .from("annual_checks")
            .select("listing_id")
            .in("listing_id", listingIds)
            .eq("status", "pending");

        const alreadyPending = new Set((existingChecks ?? []).map((c: any) => c.listing_id));
        const toCheck = listings.filter((l: any) => !alreadyPending.has(l.id));

        if (toCheck.length === 0) {
            return NextResponse.json({ triggered_count: 0, message: "All eligible listings already have pending checks." });
        }

        const deadline = new Date(now);
        deadline.setDate(deadline.getDate() + 14);

        // Batch insert annual_checks
        const checkRows = toCheck.map((l: any) => ({
            listing_id: l.id,
            status: "pending",
            sent_at: now.toISOString(),
            response_deadline: deadline.toISOString().split("T")[0],
            created_at: now.toISOString(),
        }));

        const { error: insertErr } = await admin.from("annual_checks").insert(checkRows);
        if (insertErr) throw insertErr;

        // Batch notifications for owners
        const notificationRows = toCheck
            .filter((l: any) => l.owner_id)
            .map((l: any) => ({
                user_id: l.owner_id,
                type: "annual_check",
                title: "Annual Listing Check — Action Required",
                message: `Please confirm that "${l.business_name}" is still active before ${deadline.toDateString()} to keep it live on GalaPo.`,
                data: { listing_id: l.id, listing_name: l.business_name },
                is_read: false,
                created_at: now.toISOString(),
            }));

        if (notificationRows.length > 0) {
            await admin.from("notifications").insert(notificationRows);
        }

        return NextResponse.json({
            triggered_count: toCheck.length,
            message: `Triggered annual checks for ${toCheck.length} listing(s).`,
        });
    } catch (err: any) {
        console.error("[admin/annual-checks/batch-trigger POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
