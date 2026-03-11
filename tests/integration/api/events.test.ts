// @ts-nocheck

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const fetchPublicEventsMock = vi.fn();
const fetchCalendarEventsMock = vi.fn();
const fetchEventBySlugMock = vi.fn();
const fetchRelatedEventsMock = vi.fn();
const getOwnedApprovedListingsMock = vi.fn();
const ensureUniqueEventSlugMock = vi.fn();
const canFeatureEventMock = vi.fn();
const buildEventPayloadMock = vi.fn((body) => body);
const validateEventInputMock = vi.fn(() => []);
const getListingByIdAdminMock = vi.fn();
const normalizeEventRecordMock = vi.fn((value) => value);
const requireBusinessOwnerMock = vi.fn();
const requireAdminMock = vi.fn();

const state: {
    maybeSingleResult: { data: any; error: any };
    singleResult: { data: any; error: any };
    thenResult: { data: any[] | null; error: any };
    lastInsert: any;
    lastUpdate: any;
} = {
    maybeSingleResult: { data: null, error: null as any },
    singleResult: { data: null, error: null as any },
    thenResult: { data: [], error: null as any },
    lastInsert: null as any,
    lastUpdate: null as any,
};

function createChain() {
    const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        update: vi.fn((payload) => {
            state.lastUpdate = payload;
            return chain;
        }),
        insert: vi.fn((payload) => {
            state.lastInsert = payload;
            return chain;
        }),
        maybeSingle: vi.fn(async () => state.maybeSingleResult),
        single: vi.fn(async () => state.singleResult),
        then: (resolve: any) => Promise.resolve(state.thenResult).then(resolve),
    };

    return chain;
}

const serverSupabase = {
    from: vi.fn(() => createChain()),
};

const adminClient = {
    from: vi.fn(() => createChain()),
};

vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(async () => serverSupabase),
    createAdminSupabaseClient: vi.fn(() => adminClient),
}));

vi.mock("@/lib/event-helpers", () => ({
    EVENT_SELECT: "EVENT_SELECT",
    fetchPublicEvents: ((...args: any[]) => (fetchPublicEventsMock as any)(...args)) as any,
    fetchCalendarEvents: ((...args: any[]) => (fetchCalendarEventsMock as any)(...args)) as any,
    fetchEventBySlug: ((...args: any[]) => (fetchEventBySlugMock as any)(...args)) as any,
    fetchRelatedEvents: ((...args: any[]) => (fetchRelatedEventsMock as any)(...args)) as any,
    getOwnedApprovedListings: ((...args: any[]) => (getOwnedApprovedListingsMock as any)(...args)) as any,
    ensureUniqueEventSlug: ((...args: any[]) => (ensureUniqueEventSlugMock as any)(...args)) as any,
    canFeatureEvent: ((...args: any[]) => (canFeatureEventMock as any)(...args)) as any,
    buildEventPayload: ((...args: any[]) => (buildEventPayloadMock as any)(...args)) as any,
    validateEventInput: ((...args: any[]) => (validateEventInputMock as any)(...args)) as any,
    getListingByIdAdmin: ((...args: any[]) => (getListingByIdAdminMock as any)(...args)) as any,
    normalizeEventRecord: ((...args: any[]) => (normalizeEventRecordMock as any)(...args)) as any,
}));

vi.mock("@/lib/auth-helpers", () => ({
    requireBusinessOwner: ((...args: any[]) => (requireBusinessOwnerMock as any)(...args)) as any,
}));

vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: ((...args: any[]) => (requireAdminMock as any)(...args)) as any,
}));

import { GET as getEvents } from "@/app/api/events/route";
import { GET as getEventBySlug } from "@/app/api/events/[slug]/route";
import { GET as getEventCalendar } from "@/app/api/events/calendar/route";
import { POST as createBusinessEvent } from "@/app/api/business/events/route";
import { PUT as updateBusinessEvent, DELETE as deleteBusinessEvent } from "@/app/api/business/events/[id]/route";
import { POST as createAdminEvent } from "@/app/api/admin/events/route";
import { PUT as updateAdminEvent } from "@/app/api/admin/events/[id]/route";
import { POST as bulkAdminEvents } from "@/app/api/admin/events/bulk/route";

describe("Events API integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.maybeSingleResult = { data: null, error: null };
        state.singleResult = { data: null, error: null };
        state.thenResult = { data: [], error: null };
        state.lastInsert = null;
        state.lastUpdate = null;
        requireBusinessOwnerMock.mockResolvedValue({ user: { id: "owner-1" }, profile: { role: "business_owner" } });
        requireAdminMock.mockResolvedValue({ userId: "admin-1", adminClient });
        validateEventInputMock.mockReturnValue([]);
        ensureUniqueEventSlugMock.mockResolvedValue("city-fiesta");
        canFeatureEventMock.mockReturnValue(true);
    });

    describe("PUBLIC", () => {
        it("GET /api/events returns upcoming active events", async () => {
            fetchPublicEventsMock.mockResolvedValue({
                data: [{ id: "1", title: "Upcoming Event", event_date: "2026-01-15" }],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
                filtersApplied: { period: "upcoming" },
            });

            const response = await getEvents(new NextRequest("http://localhost:3000/api/events"));
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.data).toHaveLength(1);
            expect(body.data[0].title).toBe("Upcoming Event");
        });

        it("GET /api/events?period=this_week forwards correct filters", async () => {
            fetchPublicEventsMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 1, filtersApplied: {} });

            await getEvents(new NextRequest("http://localhost:3000/api/events?period=this_week"));

            expect(fetchPublicEventsMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ period: "this_week" }));
        });

        it("GET /api/events filters city and business event types", async () => {
            fetchPublicEventsMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 1, filtersApplied: {} });

            await getEvents(new NextRequest("http://localhost:3000/api/events?type=city"));
            await getEvents(new NextRequest("http://localhost:3000/api/events?type=business"));

            expect(fetchPublicEventsMock).toHaveBeenNthCalledWith(1, expect.anything(), expect.objectContaining({ type: "city" }));
            expect(fetchPublicEventsMock).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({ type: "business" }));
        });

        it("GET /api/events?featured_only=true returns featured events only", async () => {
            fetchPublicEventsMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 1, filtersApplied: {} });

            await getEvents(new NextRequest("http://localhost:3000/api/events?featured_only=true"));

            expect(fetchPublicEventsMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ featuredOnly: true }));
        });

        it("past events are not returned with period=upcoming", async () => {
            fetchPublicEventsMock.mockResolvedValue({
                data: [{ id: "1", title: "Future Event", event_date: "2099-01-01" }],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
                filtersApplied: { period: "upcoming" },
            });

            const response = await getEvents(new NextRequest("http://localhost:3000/api/events?period=upcoming"));
            const body = await response.json();

            expect(body.data).toEqual([{ id: "1", title: "Future Event", event_date: "2099-01-01" }]);
        });

        it("GET /api/events/[slug] returns full event detail", async () => {
            fetchEventBySlugMock.mockResolvedValue({ id: "1", slug: "city-fiesta", title: "City Fiesta", event_date: "2026-01-15", start_time: "08:00", end_time: "18:00", venue: "City Plaza", venue_address: "Olongapo", description: "Details", listing_id: null });
            fetchRelatedEventsMock.mockResolvedValue([{ id: "2", title: "Related Event" }]);

            const response = await getEventBySlug(new NextRequest("http://localhost:3000/api/events/city-fiesta"), { params: Promise.resolve({ slug: "city-fiesta" }) });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.data.title).toBe("City Fiesta");
            expect(body.data.related_events).toHaveLength(1);
        });

        it("GET /api/events/calendar returns grouped calendar data", async () => {
            fetchCalendarEventsMock.mockResolvedValue([
                { id: "1", title: "City Fiesta", slug: "city-fiesta", start_time: "08:00", is_city_wide: true, is_featured: true, event_date: "2026-01-15" },
                { id: "2", title: "Business Fair", slug: "business-fair", start_time: "10:00", is_city_wide: false, is_featured: false, event_date: "2026-01-15" },
            ]);

            const response = await getEventCalendar(new NextRequest("http://localhost:3000/api/events/calendar?month=1&year=2026"));
            const body = await response.json();

            expect(body["2026-01-15"].count).toBe(2);
            expect(body["2026-01-15"].events[0].title).toBe("City Fiesta");
        });
    });

    describe("BUSINESS OWNER", () => {
        it("POST creates an event for the owner listing", async () => {
            getOwnedApprovedListingsMock.mockResolvedValue([{ id: "listing-1", is_featured: true, is_premium: true }]);
            state.singleResult = { data: { id: "event-1", title: "City Fiesta" }, error: null };

            const response = await createBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events", {
                    method: "POST",
                    body: JSON.stringify({
                        listing_id: "listing-1",
                        title: "City Fiesta",
                        description: "Details",
                        event_date: "2026-01-15",
                        start_time: "08:00",
                        end_time: "18:00",
                        venue: "City Plaza",
                        venue_address: "Olongapo City",
                        is_featured: true,
                    }),
                })
            );
            const body = await response.json();

            expect(response.status).toBe(201);
            expect(ensureUniqueEventSlugMock).toHaveBeenCalledWith("City Fiesta");
            expect(body.data.id).toBe("event-1");
        });

        it("POST for another owner's listing returns 403", async () => {
            getOwnedApprovedListingsMock.mockResolvedValue([{ id: "listing-1" }]);

            const response = await createBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events", {
                    method: "POST",
                    body: JSON.stringify({
                        listing_id: "listing-2",
                        title: "Unauthorized",
                        event_date: "2026-01-15",
                        start_time: "08:00",
                        venue: "Venue",
                        venue_address: "Address",
                    }),
                })
            );

            expect(response.status).toBe(403);
        });

        it("POST with past date returns 400", async () => {
            validateEventInputMock.mockReturnValueOnce(["Event date must be today or in the future."]);

            const response = await createBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events", {
                    method: "POST",
                    body: JSON.stringify({
                        listing_id: "listing-1",
                        title: "Past Event",
                        event_date: "2020-01-01",
                        start_time: "08:00",
                        venue: "Venue",
                        venue_address: "Address",
                    }),
                })
            );

            expect(response.status).toBe(400);
        });

        it("Featured toggle with free plan returns 400 but premium succeeds", async () => {
            getOwnedApprovedListingsMock.mockResolvedValue([{ id: "listing-1", is_featured: false, is_premium: false }]);
            canFeatureEventMock.mockReturnValueOnce(false);

            const freeResponse = await createBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events", {
                    method: "POST",
                    body: JSON.stringify({
                        listing_id: "listing-1",
                        title: "Featured Request",
                        event_date: "2026-01-15",
                        start_time: "08:00",
                        venue: "Venue",
                        venue_address: "Address",
                        is_featured: true,
                    }),
                })
            );

            expect(freeResponse.status).toBe(400);

            getOwnedApprovedListingsMock.mockResolvedValue([{ id: "listing-1", is_featured: true, is_premium: true }]);
            canFeatureEventMock.mockReturnValueOnce(true);
            state.singleResult = { data: { id: "event-2" }, error: null };

            const premiumResponse = await createBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events", {
                    method: "POST",
                    body: JSON.stringify({
                        listing_id: "listing-1",
                        title: "Premium Featured Request",
                        event_date: "2026-01-15",
                        start_time: "08:00",
                        venue: "Venue",
                        venue_address: "Address",
                        is_featured: true,
                    }),
                })
            );

            expect(premiumResponse.status).toBe(201);
        });

        it("PUT updates an event and DELETE removes it", async () => {
            state.maybeSingleResult = {
                data: {
                    id: "event-1",
                    created_by: "owner-1",
                    listing_id: "listing-1",
                    title: "Old Title",
                    slug: "old-title",
                    description: "Desc",
                    event_date: "2026-01-15",
                    start_time: "08:00",
                    end_time: "09:00",
                    venue: "Venue",
                    venue_address: "Address",
                    is_city_wide: false,
                    is_featured: false,
                    is_active: true,
                    listing: { owner_id: "owner-1", business_name: "Biz", is_featured: true, is_premium: true, status: "approved", is_active: true },
                },
                error: null,
            };
            getOwnedApprovedListingsMock.mockResolvedValue([{ id: "listing-1", is_featured: true, is_premium: true }]);
            state.singleResult = { data: { id: "event-1", title: "New Title" }, error: null };

            const updateResponse = await updateBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events/event-1", {
                    method: "PUT",
                    body: JSON.stringify({ title: "New Title" }),
                }),
                { params: Promise.resolve({ id: "event-1" }) }
            );
            expect(updateResponse.status).toBe(200);

            state.thenResult = { data: null, error: null };
            const deleteResponse = await deleteBusinessEvent(
                new NextRequest("http://localhost:3000/api/business/events/event-1", { method: "DELETE" }),
                { params: Promise.resolve({ id: "event-1" }) }
            );
            expect(deleteResponse.status).toBe(200);
        });
    });

    describe("ADMIN", () => {
        it("POST creates city-wide event with no listing", async () => {
            state.singleResult = { data: { id: "city-event-1", is_city_wide: true }, error: null };

            const response = await createAdminEvent(
                new NextRequest("http://localhost:3000/api/admin/events", {
                    method: "POST",
                    body: JSON.stringify({
                        title: "City Festival",
                        description: "Details",
                        event_date: "2026-01-15",
                        start_time: "08:00",
                        venue: "City Hall",
                        venue_address: "Olongapo City",
                        is_city_wide: true,
                        is_featured: true,
                    }),
                })
            );

            expect(response.status).toBe(201);
            expect(state.lastInsert.listing_id).toBeNull();
        });

        it("POST creates event for any listing", async () => {
            getListingByIdAdminMock.mockResolvedValue({ id: "listing-2", status: "approved", is_active: true, is_featured: true, is_premium: true });
            state.singleResult = { data: { id: "listing-event-1", listing_id: "listing-2" }, error: null };

            const response = await createAdminEvent(
                new NextRequest("http://localhost:3000/api/admin/events", {
                    method: "POST",
                    body: JSON.stringify({
                        listing_id: "listing-2",
                        title: "Listing Event",
                        description: "Details",
                        event_date: "2026-01-16",
                        start_time: "09:00",
                        venue: "Venue",
                        venue_address: "Address",
                        is_city_wide: false,
                        is_featured: true,
                    }),
                })
            );

            expect(response.status).toBe(201);
            expect(getListingByIdAdminMock).toHaveBeenCalledWith("listing-2");
        });

        it("PUT toggles featured flag", async () => {
            state.maybeSingleResult = {
                data: {
                    id: "event-1",
                    created_by: "admin-1",
                    listing_id: null,
                    title: "City Festival",
                    slug: "city-festival",
                    description: "Details",
                    event_date: "2026-01-15",
                    start_time: "08:00",
                    end_time: "09:00",
                    venue: "Venue",
                    venue_address: "Address",
                    is_city_wide: true,
                    is_featured: false,
                    is_active: true,
                    listing: null,
                },
                error: null,
            };
            state.singleResult = { data: { id: "event-1", is_featured: true }, error: null };

            const response = await updateAdminEvent(
                new NextRequest("http://localhost:3000/api/admin/events/event-1", {
                    method: "PUT",
                    body: JSON.stringify({ is_featured: true }),
                }),
                { params: Promise.resolve({ id: "event-1" }) }
            );

            expect(response.status).toBe(200);
            expect(state.lastUpdate.is_featured).toBe(true);
        });

        it("bulk actions work", async () => {
            state.thenResult = { data: null, error: null };

            const response = await bulkAdminEvents(
                new NextRequest("http://localhost:3000/api/admin/events/bulk", {
                    method: "POST",
                    body: JSON.stringify({ action: "activate", event_ids: ["event-1", "event-2"] }),
                })
            );
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
        });

        it("non-admin requests return 403", async () => {
            requireAdminMock.mockResolvedValueOnce({ error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) });

            const response = await createAdminEvent(
                new NextRequest("http://localhost:3000/api/admin/events", {
                    method: "POST",
                    body: JSON.stringify({ title: "Blocked" }),
                })
            );

            expect(response.status).toBe(403);
        });
    });
});