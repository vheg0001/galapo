import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/business/annual-check/respond
 * Business owner confirms their listing is still active.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { check_id, listing_id, notes } = body;

        if (!check_id || !listing_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Verify ownership of the listing
        const { data: listing, error: listingError } = await supabase
            .from("listings")
            .select("id, business_name, owner_id")
            .eq("id", listing_id)
            .eq("owner_id", user.id)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: "Listing not found or unauthorized" }, { status: 404 });
        }

        // 2. Use Admin Client to update the status (bypassing possible RLS restrictions on annual_checks update)
        // Note: Usually owners can view their annual checks but might not have permission to update status directly.
        const admin = createAdminSupabaseClient();

        const now = new Date().toISOString();

        // Update the annual check record
        const { error: checkUpdateError } = await admin
            .from("annual_checks")
            .update({
                status: "confirmed",
                responded_at: now,
                notes: notes || `Confirmed by owner via dashboard.`
            })
            .eq("id", check_id)
            .eq("listing_id", listing_id);

        if (checkUpdateError) throw checkUpdateError;

        // 3. Update the listing's last_verified_at field
        const { error: listingUpdateError } = await admin
            .from("listings")
            .update({
                last_verified_at: now
            })
            .eq("id", listing_id);

        if (listingUpdateError) throw listingUpdateError;

        // 4. Create an internal notification for admins
        const { data: adminUser } = await admin
            .from("profiles")
            .select("id")
            .eq("role", "super_admin")
            .limit(1)
            .single();

        if (adminUser) {
            await admin.from("notifications").insert({
                user_id: adminUser.id,
                type: "payment_confirmed", // Using a generic success type or we could add a new one if available
                title: "Annual Check Confirmed",
                message: `The owner of "${listing.business_name}" has confirmed their listing is still active.`,
                data: { listing_id: listing.id, check_id }
            });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Listing successfully verified for another year." 
        });

    } catch (error: any) {
        console.error("[ANNUAL_CHECK_RESPOND] Error:", error);
        return NextResponse.json({ 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
