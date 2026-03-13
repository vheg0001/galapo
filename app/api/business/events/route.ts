import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import {
    EVENT_SELECT,
    buildEventPayload,
    canFeatureEvent,
    ensureUniqueEventSlug,
    getOwnedApprovedListings,
    normalizeEventRecord,
    validateEventInput,
} from "@/lib/event-helpers";

export const dynamic = "force-dynamic";

const PLAN_LIMITS = {
    free: 1,
    featured: 3,
    premium: 5,
};

function getPlanLimit(listing: any) {
    if (listing.is_premium) return PLAN_LIMITS.premium;
    if (listing.is_featured) return PLAN_LIMITS.featured;
    return PLAN_LIMITS.free;
}

function getToday() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export async function GET(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ("error" in auth) return auth.error;

    try {
        const supabase = await createServerSupabaseClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "all";
        const listingId = searchParams.get("listing_id");
        const today = getToday();
        const ownedListings = await getOwnedApprovedListings(supabase, auth.user.id);
        const ownedListingIds = ownedListings.map((listing) => listing.id);

        if (ownedListingIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        let query = supabase
            .from("events")
            .select(EVENT_SELECT)
            .in("listing_id", ownedListingIds)
            .eq("is_city_wide", false);

        if (listingId) {
            if (!ownedListingIds.includes(listingId)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            query = query.eq("listing_id", listingId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const events = (data || []).map(normalizeEventRecord).filter((event) => {
            const eventDate = event.event_date.split("T")[0];
            if (status === "upcoming") return eventDate >= today;
            if (status === "past") return eventDate < today;
            return true;
        }).sort((a, b) => a.event_date.localeCompare(b.event_date));

        // Calculate limits for each listing
        const limits = await Promise.all(ownedListings.map(async (l) => {
            const limit = getPlanLimit(l);
            const { count } = await supabase
                .from("events")
                .select("*", { count: "exact", head: true })
                .eq("listing_id", l.id)
                .gte("event_date", today);
            
            return {
                listing_id: l.id,
                business_name: l.business_name,
                plan: l.is_premium ? "premium" : l.is_featured ? "featured" : "free",
                max: limit,
                used: count || 0,
                remaining: Math.max(0, limit - (count || 0))
            };
        }));

        return NextResponse.json({ 
            data: events,
            limits 
        });
    } catch (error: any) {
        console.error("[api/business/events GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ("error" in auth) return auth.error;

    try {
        const supabase = await createServerSupabaseClient();
        const body = await request.json();
        const errors = validateEventInput(body, { isNew: true, requireListing: true, allowCityWide: false });

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
        }

        const listings = await getOwnedApprovedListings(supabase, auth.user.id);
        const listing = listings.find((item) => item.id === body.listing_id);

        if (!listing) {
            return NextResponse.json({ error: "Listing does not belong to you or is not approved." }, { status: 403 });
        }

        if (body.is_featured && !canFeatureEvent(listing)) {
            return NextResponse.json({ error: "Featured events require a Featured or Premium plan." }, { status: 400 });
        }

        // Enforce plan limits
        const today = getToday();
        const { count: activeEventCount, error: countError } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("listing_id", body.listing_id)
            .gte("event_date", today);

        if (countError) throw countError;

        const limit = getPlanLimit(listing);
        if ((activeEventCount || 0) >= limit) {
            return NextResponse.json({
                error: `Limit reached. Your current plan allows up to ${limit} active events for this listing.`
            }, { status: 400 });
        }

        const slug = await ensureUniqueEventSlug(body.title);
        const payload = buildEventPayload({ ...body, slug, is_city_wide: false }, auth.user.id);

        const { data, error } = await supabase
            .from("events")
            .insert(payload)
            .select("*")
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        console.error("[api/business/events POST]", error);
        return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 });
    }
}