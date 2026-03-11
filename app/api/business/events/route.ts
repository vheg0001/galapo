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

        return NextResponse.json({ data: events });
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