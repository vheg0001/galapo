import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
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
        const { data: listings, error: listingErr } = await admin
            .from("listings")
            .select("id, business_name, owner_id, last_verified_at")
            .eq("is_active", true)
            .or(`last_verified_at.is.null,last_verified_at.lt.${oneYearAgo.toISOString()}`);

        if (listingErr) throw listingErr;
        if (!listings || listings.length === 0) {
            return NextResponse.json({ triggered: 0, owners_notified: 0, pre_populated_flagged: 0 });
        }

        const listingIds = listings.map((l: any) => l.id);
        const { data: existingChecks } = await admin
            .from("annual_checks")
            .select("listing_id")
            .in("listing_id", listingIds)
            .eq("status", "pending");

        const alreadyPending = new Set((existingChecks ?? []).map((c: any) => c.listing_id));
        const toCheck = listings.filter((l: any) => !alreadyPending.has(l.id));

        if (toCheck.length === 0) {
            return NextResponse.json({ triggered: 0, owners_notified: 0, pre_populated_flagged: 0 });
        }

        const deadline = new Date(now);
        deadline.setDate(deadline.getDate() + 7);

        const checkRows = toCheck.map((l: any) => ({
            listing_id: l.id,
            status: "pending",
            sent_at: now.toISOString(),
            response_deadline: deadline.toISOString().split("T")[0],
            created_at: now.toISOString(),
        }));

        const { error: insertErr } = await admin.from("annual_checks").insert(checkRows);
        if (insertErr) throw insertErr;

        const notificationRows = toCheck
            .filter((l: any) => l.owner_id)
            .map((l: any) => ({
                user_id: l.owner_id,
                type: "annual_check",
                title: "Annual Listing Verification Required",
                message: `Your listing "${l.business_name}" is due for its annual verification. Please confirm its status.`,
                data: { listing_id: l.id, listing_name: l.business_name },
                created_at: now.toISOString(),
            }));

        if (notificationRows.length > 0) {
            await admin.from("notifications").insert(notificationRows);
        }

        const owners_notified = notificationRows.length;
        const pre_populated_flagged = toCheck.length - owners_notified;

        // Log pre-populated in notes so admins know
        const flaggedListings = toCheck.filter((l: any) => !l.owner_id);
        if (flaggedListings.length > 0) {
            console.log(`[Batch Trigger] ${flaggedListings.length} pre-populated listings require admin review`);
            // Custom admin notes or logs could go here
        }

        return NextResponse.json({
            triggered: toCheck.length,
            owners_notified,
            pre_populated_flagged
        });
    } catch (err: any) {
        console.error("[admin/annual-checks/batch-trigger POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
