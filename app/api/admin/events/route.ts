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

function todayString() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "all";
        const status = searchParams.get("status") || "all";
        const featured = searchParams.get("featured");
        const search = (searchParams.get("search") || "").toLowerCase();
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");
        const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "20", 10), 1), 100);
        const today = todayString();

        const { data, error } = await auth.adminClient
            .from("events")
            .select(EVENT_SELECT);
        if (error) throw error;

        const rows = (data || []).map(normalizeEventRecord).filter((event) => {
            const eventDate = event.event_date.split("T")[0];
            if (type === "city" && !event.is_city_wide) return false;
            if (type === "business" && event.is_city_wide) return false;
            if (status === "upcoming" && eventDate < today) return false;
            if (status === "past" && eventDate >= today) return false;
            if (featured === "true" && !event.is_featured) return false;
            if (featured === "false" && event.is_featured) return false;
            if (dateFrom && eventDate < dateFrom) return false;
            if (dateTo && eventDate > dateTo) return false;
            if (search) {
                const haystack = `${event.title} ${event.listing?.business_name || ""}`.toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return true;
        }).sort((a, b) => a.event_date.localeCompare(b.event_date));

        const total = rows.length;
        const offset = (page - 1) * limit;

        return NextResponse.json({
            data: rows.slice(offset, offset + limit),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error: any) {
        console.error("[api/admin/events GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const isCityWide = body.is_city_wide ?? !body.listing_id;
        const errors = validateEventInput(
            { ...body, is_city_wide: isCityWide },
            { isNew: true, requireListing: !isCityWide, allowCityWide: true }
        );

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
        }

        let listing = null;
        if (!isCityWide && body.listing_id) {
            listing = await getListingByIdAdmin(body.listing_id);
            if (!listing || listing.status !== "approved" || !listing.is_active) {
                return NextResponse.json({ error: "Listing must be approved and active." }, { status: 400 });
            }
            if (body.is_featured && !canFeatureEvent(listing)) {
                return NextResponse.json({ error: "Listing must be Featured or Premium for featured events." }, { status: 400 });
            }
        }

        const slug = await ensureUniqueEventSlug(body.title);
        const payload = buildEventPayload(
            {
                ...body,
                slug,
                listing_id: isCityWide ? null : body.listing_id,
                is_city_wide: isCityWide,
                is_featured: body.is_featured ?? isCityWide,
            },
            auth.userId
        );

        const { data, error } = await auth.adminClient
            .from("events")
            .insert(payload)
            .select("*")
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        console.error("[api/admin/events POST]", error);
        return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 });
    }
}