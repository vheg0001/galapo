import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const now = new Date();

        // 1. Get all listings for user
        const { data: listings } = await supabase
            .from("listings")
            .select("id, business_name")
            .eq("owner_id", userId);

        if (!listings || listings.length === 0) {
            return NextResponse.json([]);
        }

        const listingIds = listings.map(l => l.id);

        // 2. Get active checks for those listings
        const { data: checks } = await supabase
            .from("annual_checks")
            .select("*")
            .in("listing_id", listingIds)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (!checks || checks.length === 0) {
            return NextResponse.json([]);
        }

        // Map checks with listing names
        const listingMap = new Map(listings.map(l => [l.id, l.business_name]));
        
        const responseData = checks.map(c => {
            const deadline = new Date(c.response_deadline);
            const msDiff = deadline.getTime() - now.getTime();
            const days_remaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

            return {
                check_id: c.id,
                listing_id: c.listing_id,
                listing_name: listingMap.get(c.listing_id),
                check_date: c.sent_at,
                response_deadline: c.response_deadline,
                days_remaining
            };
        });

        return NextResponse.json(responseData);
    } catch (err: any) {
        console.error("[business/annual-check GET]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { check_id, response } = await request.json() as { check_id: string, response: "operating"|"closed" };

        if (!check_id || !["operating", "closed"].includes(response)) {
            return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
        }

        const now = new Date();

        // Validate that this check belongs to the user
        const { data: check } = await supabase
            .from("annual_checks")
            .select("id, listing_id, status, listings!inner(owner_id, business_name)")
            .eq("id", check_id)
            .single();

        if (!check || (check.listings as any).owner_id !== session.user.id) {
            return NextResponse.json({ error: "Check not found or unauthorized." }, { status: 404 });
        }

        if (check.status !== "pending") {
            return NextResponse.json({ error: "Check is no longer pending." }, { status: 400 });
        }

        const listingName = (check.listings as any).business_name;
        
        // We use admin client for sensitive updates over other tables
        const { createAdminSupabaseClient } = await import("@/lib/supabase");
        const admin = createAdminSupabaseClient();

        if (response === "operating") {
            // Confirm check, update listing, notify admins
            await Promise.all([
                admin.from("annual_checks").update({
                    status: "confirmed",
                    responded_at: now.toISOString()
                }).eq("id", check_id),
                admin.from("listings").update({
                    last_verified_at: now.toISOString(),
                    updated_at: now.toISOString()
                }).eq("id", check.listing_id),
                // notify admins
                admin.from("notifications").insert({
                    user_id: "00000000-0000-0000-0000-000000000000", // Generic ID for admin, or broadcast role specific if you have
                    type: "annual_check_resolved",
                    title: "Business Re-verified",
                    message: `Business owner confirmed "${listingName}" is still operating.`,
                    data: { listing_id: check.listing_id }
                })
            ]);
            return NextResponse.json({ success: true, message: "Listing verified successfully." });
        } 
        
        if (response === "closed") {
            // Inform admin, keep pending
            await admin.from("notifications").insert({
                user_id: "00000000-0000-0000-0000-000000000000",
                type: "annual_check_closure",
                title: "Business Reported Closed",
                message: `Owner of "${listingName}" reported the business as closed. Pending review for deactivation.`,
                data: { listing_id: check.listing_id, check_id }
            });
            // Also adding an admin note for better operational tracking
            await admin.from("admin_user_notes").insert({
                user_id: session.user.id,
                admin_id: session.user.id, // Using the owner's ID to denote they initiated the note via API
                note: `[ANNUAL CHECK] Owner reported listing "${listingName}" as closed.`
            });

            return NextResponse.json({ success: true, message: "Report submitted. Amin will review and deactivate the listing." });
        }
    } catch (err: any) {
        console.error("[business/annual-check POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
