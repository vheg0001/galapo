import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import {
    EVENT_SELECT,
    buildEventPayload,
    canFeatureEvent,
    ensureUniqueEventSlug,
    getListingByIdAdmin,
    normalizeEventRecord,
    validateEventInput,
} from "@/lib/event-helpers";

export const dynamic = "force-dynamic";

async function getAdminEvent(adminClient: any, id: string) {
    const { data, error } = await adminClient
        .from("events")
        .select(EVENT_SELECT)
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    return data ? normalizeEventRecord(data) : null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const event = await getAdminEvent(auth.adminClient, id);

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        return NextResponse.json({ data: event });
    } catch (error: any) {
        console.error("[api/admin/events/[id] GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch event" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const existing = await getAdminEvent(auth.adminClient, id);
        if (!existing) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const body = await request.json();
        const isCityWide = body.is_city_wide ?? existing.is_city_wide;
        const merged = {
            ...existing,
            ...body,
            is_city_wide: isCityWide,
            listing_id: isCityWide ? null : (body.listing_id ?? existing.listing_id),
        };

        const errors = validateEventInput(merged, { isNew: false, requireListing: !isCityWide, allowCityWide: true });
        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
        }

        let listing = null;
        if (!isCityWide && merged.listing_id) {
            listing = await getListingByIdAdmin(merged.listing_id);
            if (!listing || listing.status !== "approved" || !listing.is_active) {
                return NextResponse.json({ error: "Listing must be approved and active." }, { status: 400 });
            }
            if (merged.is_featured && !canFeatureEvent(listing)) {
                return NextResponse.json({ error: "Listing must be Featured or Premium for featured events." }, { status: 400 });
            }
        }

        const slug = merged.title !== existing.title
            ? await ensureUniqueEventSlug(merged.title, id)
            : existing.slug;

        const payload = buildEventPayload(
            {
                ...merged,
                slug,
                listing_id: isCityWide ? null : merged.listing_id,
            },
            existing.created_by,
            { updated_at: new Date().toISOString() }
        );

        const { data, error } = await auth.adminClient
            .from("events")
            .update(payload)
            .eq("id", id)
            .select("*")
            .single();
        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[api/admin/events/[id] PUT]", error);
        return NextResponse.json({ error: error.message || "Failed to update event" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const { error } = await auth.adminClient.from("events").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[api/admin/events/[id] DELETE]", error);
        return NextResponse.json({ error: error.message || "Failed to delete event" }, { status: 500 });
    }
}