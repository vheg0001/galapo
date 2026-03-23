import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import {
    buildEventPayload,
    canFeatureEvent,
    ensureUniqueEventSlug,
    getOwnedApprovedListings,
    normalizeEventRecord,
    validateEventInput,
} from "@/lib/event-helpers";

export const dynamic = "force-dynamic";

async function getOwnedEvent(supabase: any, id: string, userId: string) {
    const { data, error } = await supabase
        .from("events")
        .select(`
            id,
            listing_id,
            title,
            slug,
            description,
            image_url,
            event_date,
            start_time,
            end_time,
            venue,
            venue_address,
            is_city_wide,
            is_featured,
            created_by,
            is_active,
            created_at,
            updated_at,
            listing:listings(
                owner_id,
                business_name,
                slug,
                address,
                lat,
                lng,
                is_featured,
                is_premium,
                status,
                is_active
            )
        `)
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const ownerId = data.listing?.owner_id;
    if (data.created_by !== userId && ownerId !== userId) {
        return null;
    }

    return data;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const supabase = await createServerSupabaseClient();
        const event = await getOwnedEvent(supabase, id, auth.user.id);

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json({ data: normalizeEventRecord(event) });
    } catch (error: any) {
        console.error("[api/business/events/[id] GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch event" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const supabase = await createServerSupabaseClient();
        const existing = await getOwnedEvent(supabase, id, auth.user.id);

        if (!existing) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const body = await request.json();
        const merged = {
            ...existing,
            ...body,
            listing_id: body.listing_id ?? existing.listing_id,
        };
        const errors = validateEventInput(merged, { isNew: false, requireListing: true, allowCityWide: false });
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
        }

        const listings = await getOwnedApprovedListings(supabase, auth.user.id);
        const listing = listings.find((item) => item.id === merged.listing_id);
        if (!listing) {
            return NextResponse.json({ error: "Listing does not belong to you or is not approved." }, { status: 403 });
        }

        if (merged.is_featured && !canFeatureEvent(listing)) {
            return NextResponse.json({ error: "Featured events require a Featured or Premium plan." }, { status: 400 });
        }

        const slug = merged.title !== existing.title
            ? await ensureUniqueEventSlug(merged.title, id)
            : existing.slug;

        const payload = buildEventPayload({ ...merged, slug, is_city_wide: false }, existing.created_by, { updated_at: new Date().toISOString() });

        const { data, error } = await supabase
            .from("events")
            .update(payload)
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[api/business/events/[id] PUT]", error);
        return NextResponse.json({ error: error.message || "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const supabase = await createServerSupabaseClient();
        const existing = await getOwnedEvent(supabase, id, auth.user.id);

        if (!existing) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const { error } = await supabase.from("events").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[api/business/events/[id] DELETE]", error);
        return NextResponse.json({ error: error.message || "Failed to delete event" }, { status: 500 });
    }
}