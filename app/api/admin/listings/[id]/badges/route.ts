import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET: Fetch all badges for a listing (active and history).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id: listingId } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { data: rawBadges, error } = await admin
            .from("listing_badges")
            .select(`
                id, 
                listing_id, 
                badge_id, 
                assigned_by, 
                assigned_at, 
                expires_at, 
                note, 
                is_active, 
                created_at,
                badges ( id, name, slug, icon, icon_lucide, color, text_color, type, priority, description )
            `)
            .eq("listing_id", listingId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Map the Supabase 'badges' joined object to 'badge' for the frontend
        const listingBadges = rawBadges?.map((lb: any) => ({
            ...lb,
            badge: lb.badges
        })) || [];

        return NextResponse.json({ data: listingBadges });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST: Assign a badge to a listing.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id: listingId } = await params;
    const { userId: adminId, adminClient: admin } = auth;

    try {
        const body = await request.json();
        const { badge_id, note, expires_at } = body;

        if (!badge_id) {
            return NextResponse.json({ error: "Badge ID is required." }, { status: 400 });
        }

        // 1. Validate badge exists and is active
        const { data: badge, error: badgeError } = await admin
            .from("badges")
            .select("*")
            .eq("id", badge_id)
            .single();

        if (badgeError || !badge || !badge.is_active) {
            return NextResponse.json({ error: "Badge not found or is inactive." }, { status: 404 });
        }

        // 2. Validate max 5 active admin badges
        const { count, error: countError } = await admin
            .from("listing_badges")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", listingId)
            .eq("is_active", true);

        if (countError) throw countError;
        if (count && count >= 5) {
            return NextResponse.json({ error: "Maximum of 5 active badges reached for this listing." }, { status: 400 });
        }

        // 3. Check if already assigned
        const { data: existing } = await admin
            .from("listing_badges")
            .select("id")
            .eq("listing_id", listingId)
            .eq("badge_id", badge_id)
            .eq("is_active", true)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "This badge is already active for this listing." }, { status: 409 });
        }

        // 4. Calculate expiry if not provided and badge has auto_expires
        let finalExpiresAt = expires_at || null;
        if (!finalExpiresAt && badge.auto_expires && badge.default_expiry_days) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + badge.default_expiry_days);
            finalExpiresAt = expiry.toISOString();
        }

        // 5. Insert assignment
        const { data, error: insertError } = await admin
            .from("listing_badges")
            .insert({
                listing_id: listingId,
                badge_id: badge_id,
                assigned_by: adminId,
                assigned_at: new Date().toISOString(),
                expires_at: finalExpiresAt,
                note: note || null,
                is_active: true,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 6. Create notification for business owner
        const { data: listing } = await admin
            .from("listings")
            .select("owner_id, business_name")
            .eq("id", listingId)
            .single();

        if (listing?.owner_id) {
            await admin.from("notifications").insert({
                user_id: listing.owner_id,
                type: "badge_earned",
                title: "Badge Earned! 🏅",
                message: `Your listing "${listing.business_name}" earned the "${badge.name}" badge!`,
                data: { listing_id: listingId, badge_id: badge_id, badge_name: badge.name },
            });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE: Remove a badge from a listing (soft delete).
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id: listingId } = await params;
    const admin = createAdminSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const badgeId = searchParams.get("badge_id");

    if (!badgeId) {
        return NextResponse.json({ error: "Badge ID is required as a query parameter." }, { status: 400 });
    }

    try {
        const { error } = await admin
            .from("listing_badges")
            .update({ is_active: false })
            .eq("listing_id", listingId)
            .eq("badge_id", badgeId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
