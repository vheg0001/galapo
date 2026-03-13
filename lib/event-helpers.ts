import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, endOfMonth, format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { createAdminSupabaseClient } from "@/lib/supabase";
import type { Event, PlanType } from "@/lib/types";

export type EventPeriod = "upcoming" | "this_week" | "this_month" | "past";
export type EventTypeFilter = "all" | "city" | "business";

export const EVENT_SELECT = `
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
    listing:listings (
        id,
        business_name,
        slug,
        address,
        lat,
        lng,
        is_featured,
        is_premium,
        category:categories!listings_category_id_fkey (id, name, slug, parent_id),
        barangay:barangays (id, name, slug),
        listing_badges (
            id,
            is_active,
            expires_at,
            badge:badges (
                id,
                name,
                slug,
                description,
                icon,
                icon_lucide,
                color,
                text_color,
                type,
                priority,
                is_active
            )
        )
    )
`;

export interface PublicEventQueryOptions {
    period?: EventPeriod;
    type?: EventTypeFilter;
    category?: string | null;
    barangay?: string | null;
    search?: string | null;
    featuredOnly?: boolean;
    month?: number | null;
    year?: number | null;
    page?: number;
    limit?: number;
}

function todayDateString() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function normalizeEventRecord(row: any): Event {
    const listingRelation = Array.isArray(row.listing) ? row.listing[0] : row.listing;
    const listing = listingRelation
        ? {
            ...listingRelation,
            category: Array.isArray(listingRelation.category) ? listingRelation.category[0] || null : listingRelation.category || null,
            barangay: Array.isArray(listingRelation.barangay) ? listingRelation.barangay[0] || null : listingRelation.barangay || null,
            listing_badges: (listingRelation.listing_badges || [])
                .map((badgeRow: any) => ({ ...badgeRow, badge: badgeRow.badge }))
                .filter((badgeRow: any) => badgeRow.badge),
        }
        : null;

    // Effective featured status: event is featured if its own flag is true OR its listing is featured/premium
    const isFeatured = Boolean(row.is_featured || listing?.is_featured || listing?.is_premium);

    return {
        ...row,
        is_featured: isFeatured,
        listing,
    } as Event;
}

function compareEvents(a: Event, b: Event, period: EventPeriod) {
    const dateCompare = a.event_date.localeCompare(b.event_date);

    if (period === "past") {
        if (dateCompare !== 0) return -dateCompare;
        return (b.start_time || "").localeCompare(a.start_time || "");
    }

    if (dateCompare !== 0) return dateCompare;
    return (a.start_time || "").localeCompare(b.start_time || "");
}

function matchesPeriod(event: Event, period: EventPeriod, month?: number | null, year?: number | null) {
    const today = todayDateString();
    const eventDate = event.event_date.split("T")[0];

    if (month && year) {
        const parsed = parseISO(`${eventDate}T00:00:00`);
        return parsed.getMonth() + 1 === month && parsed.getFullYear() === year;
    }

    if (period === "past") return eventDate < today;
    if (period === "this_week") {
        const end = format(addDays(parseISO(`${today}T00:00:00`), 7), "yyyy-MM-dd");
        return eventDate >= today && eventDate <= end;
    }
    if (period === "this_month") {
        const now = parseISO(`${today}T00:00:00`);
        return isSameMonth(parseISO(`${eventDate}T00:00:00`), now);
    }
    return eventDate >= today;
}

function matchesType(event: Event, type: EventTypeFilter) {
    if (type === "city") return event.is_city_wide;
    if (type === "business") return !event.is_city_wide;
    return true;
}

function matchesFeatured(event: Event, featuredOnly?: boolean) {
    if (!featuredOnly) return true;
    return event.is_featured;
}

function matchesCategory(event: Event, category?: string | null) {
    if (!category) return true;
    if (event.is_city_wide) return false;
    return event.listing?.category?.slug === category;
}

function matchesBarangay(event: Event, barangay?: string | null) {
    if (!barangay) return true;
    if (event.is_city_wide) return false;
    return event.listing?.barangay?.slug === barangay;
}

function matchesSearch(event: Event, search?: string | null) {
    if (!search) return true;
    return event.title.toLowerCase().includes(search.toLowerCase());
}

export async function fetchPublicEvents(
    supabase: SupabaseClient,
    options: PublicEventQueryOptions = {}
) {
    const period = options.period || "upcoming";
    const type = options.type || "all";
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 20, 1), 100);

    console.log(`[fetchPublicEvents] Querying events (is_active=true)...`);
    const { data, error } = await supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("is_active", true);

    if (error) {
        console.error('[fetchPublicEvents] Supabase error:', error);
        throw error;
    }

    console.log(`[fetchPublicEvents] Total active events from DB: ${data?.length || 0}`);

    const filtered = (data || [])
        .map(normalizeEventRecord)
        .filter((event) => {
            const matches = matchesPeriod(event, period, options.month, options.year);
            return matches;
        })
        .filter((event) => matchesType(event, type))
        .filter((event) => matchesCategory(event, options.category))
        .filter((event) => matchesBarangay(event, options.barangay))
        .filter((event) => matchesSearch(event, options.search))
        .filter((event) => matchesFeatured(event, options.featuredOnly))
        .sort((a, b) => compareEvents(a, b, period));

    console.log(`[fetchPublicEvents] Events after filtering: ${filtered.length}`);

    const total = filtered.length;
    const offset = (page - 1) * limit;

    return {
        data: filtered.slice(offset, offset + limit),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        filtersApplied: {
            period,
            type,
            category: options.category || null,
            barangay: options.barangay || null,
            search: options.search || null,
            featured_only: Boolean(options.featuredOnly),
            month: options.month || null,
            year: options.year || null,
        },
    };
}

export async function fetchCalendarEvents(
    supabase: SupabaseClient,
    month: number,
    year: number
) {
    const { data, error } = await supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("is_active", true);

    if (error) throw error;

    return (data || [])
        .map(normalizeEventRecord)
        .filter((event) => matchesPeriod(event, "upcoming", month, year))
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
}

export async function fetchEventBySlug(supabase: SupabaseClient, slug: string) {
    const { data, error } = await supabase
        .from("events")
        .select(EVENT_SELECT)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return normalizeEventRecord(data);
}

export async function fetchRelatedEvents(
    supabase: SupabaseClient,
    currentEvent: Event,
    limit: number = 4
) {
    const result = await fetchPublicEvents(supabase, { period: "upcoming", limit: 100, type: "all" });

    return result.data
        .filter((event) => event.id !== currentEvent.id)
        .filter((event) => {
            if (currentEvent.is_city_wide) return event.is_city_wide;
            if (currentEvent.listing?.category?.slug) {
                return event.listing?.category?.slug === currentEvent.listing.category.slug || event.is_city_wide;
            }
            return true;
        })
        .slice(0, limit);
}

export function getListingPlan(listing?: {
    is_featured?: boolean | null;
    is_premium?: boolean | null;
} | null): PlanType {
    if (listing?.is_premium) return "premium" as PlanType;
    if (listing?.is_featured) return "featured" as PlanType;
    return "free" as PlanType;
}

export function canFeatureEvent(listing?: {
    is_featured?: boolean | null;
    is_premium?: boolean | null;
} | null) {
    return Boolean(listing?.is_featured || listing?.is_premium);
}

export function slugifyEventTitle(title: string) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

export async function ensureUniqueEventSlug(title: string, excludeId?: string) {
    const admin = createAdminSupabaseClient();
    const base = slugifyEventTitle(title) || "event";
    let slug = base;
    let attempt = 1;

    while (true) {
        let query = admin.from("events").select("id").eq("slug", slug).maybeSingle();
        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.id === excludeId) return slug;

        attempt += 1;
        slug = `${base}-${attempt}`;
    }
}

export async function getOwnedApprovedListings(supabase: SupabaseClient, ownerId: string) {
    const { data, error } = await supabase
        .from("listings")
        .select("id, owner_id, business_name, slug, address, lat, lng, is_featured, is_premium, status, is_active")
        .eq("owner_id", ownerId)
        .eq("status", "approved")
        .eq("is_active", true)
        .order("business_name", { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getListingByIdAdmin(listingId: string) {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
        .from("listings")
        .select("id, owner_id, business_name, slug, address, lat, lng, is_featured, is_premium, status, is_active")
        .eq("id", listingId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export function buildEventPayload(body: any, createdBy: string, overrides: Partial<Event> = {}) {
    return {
        listing_id: body.listing_id || null,
        title: body.title?.trim(),
        slug: body.slug,
        description: body.description?.trim() || "",
        image_url: body.image_url || null,
        event_date: body.event_date,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        venue: body.venue?.trim(),
        venue_address: body.venue_address?.trim(),
        is_city_wide: Boolean(body.is_city_wide),
        is_featured: Boolean(body.is_featured),
        created_by: createdBy,
        is_active: body.is_active ?? true,
        ...overrides,
    };
}

export function validateEventInput(body: any, opts: { isNew?: boolean; requireListing?: boolean; allowCityWide?: boolean } = {}) {
    const errors: string[] = [];
    const today = todayDateString();

    if (opts.requireListing && !body.listing_id) {
        errors.push("Listing is required.");
    }
    if (!body.title?.trim()) errors.push("Title is required.");
    if ((body.title || "").trim().length > 200) errors.push("Title must be 200 characters or fewer.");
    if (!body.event_date) errors.push("Event date is required.");
    if (opts.isNew && body.event_date && body.event_date < today) errors.push("Event date must be today or in the future.");
    if (!body.start_time && !body.all_day) errors.push("Start time is required.");
    if (!body.venue?.trim()) errors.push("Venue is required.");
    if ((body.venue || "").trim().length > 200) errors.push("Venue must be 200 characters or fewer.");
    if (!body.venue_address?.trim()) errors.push("Venue address is required.");
    if (!opts.allowCityWide && body.is_city_wide) errors.push("City-wide events are not allowed here.");
    if (body.end_time && body.start_time && body.end_time < body.start_time) errors.push("End time must be after start time.");

    return errors;
}

export function getMonthWindow(month: number, year: number) {
    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(start);
    return {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
    };
}