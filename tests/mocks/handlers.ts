import { http, HttpResponse } from "msw";
import { APP_URL } from "@/lib/constants";
import * as factories from "./factories";

export const handlers = [
    // Example handler for fetching businesses
    http.get(`${APP_URL}/api/businesses`, ({ request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit")) || 10;

        // Generate some mock data
        const businesses = Array.from({ length: Math.min(limit, 5) }).map(() =>
            factories.createMockListing()
        );

        return HttpResponse.json({
            success: true,
            data: businesses,
            total: 50,
            page: 1,
            limit,
            totalPages: Math.ceil(50 / limit),
            hasNextPage: true,
            hasPrevPage: false,
        });
    }),

    // Example handler for fetching a single business
    http.get(`${APP_URL}/api/businesses/:slug`, ({ params }) => {
        const { slug } = params;

        if (slug === "not-found") {
            return new HttpResponse(JSON.stringify({ error: "Not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const business = factories.createMockListing({ slug: slug as string });

        return HttpResponse.json({
            success: true,
            data: business,
        });
    }),

    // Auth: Register
    http.post(`${APP_URL}/api/auth/register`, async ({ request }) => {
        const { email } = await request.json() as any;
        if (email === "duplicate@example.com") {
            return HttpResponse.json({ error: "Email already exists." }, { status: 409 });
        }
        return HttpResponse.json({
            success: true,
            user: factories.createMockUser({ email }),
            profile: { id: "123", email, full_name: "Test User", role: "business_owner" }
        }, { status: 201 });
    }),

    // Auth: Login
    http.post(`${APP_URL}/api/auth/login`, async ({ request }) => {
        const { email, password } = await request.json() as any;
        if (password === "wrong") {
            return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        return HttpResponse.json({
            success: true,
            user: factories.createMockUser({ email }),
            profile: { id: "123", email, full_name: "Test User", role: "business_owner", is_active: true }
        });
    }),

    // Auth: Logout
    http.post(`${APP_URL}/api/auth/logout`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Auth: Forgot Password
    http.post(`${APP_URL}/api/auth/forgot-password`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Auth: Reset Password
    http.post(`${APP_URL}/api/auth/reset-password`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Auth: Session
    http.get(`${APP_URL}/api/auth/session`, () => {
        return HttpResponse.json({
            user: factories.createMockUser(),
            profile: { id: "123", email: "user@example.com", role: "business_owner", is_active: true }
        });
    }),

    // Notifications
    http.get(`${APP_URL}/api/notifications`, () => {
        const notifications = Array.from({ length: 5 }).map(() => factories.createMockNotification());
        return HttpResponse.json({
            data: notifications,
            meta: { total: 5, page: 1, limit: 20, totalPages: 1, unread_count: 3 }
        });
    }),

    http.patch(`${APP_URL}/api/notifications/:id/read`, () => {
        return HttpResponse.json({ success: true });
    }),

    http.patch(`${APP_URL}/api/notifications/read-all`, () => {
        return HttpResponse.json({ success: true });
    }),

    // Admin Subscriptions
    http.get(`${APP_URL}/api/admin/subscriptions`, () => {
        const subscriptions = Array.from({ length: 5 }).map(() => ({
            ...factories.createMockSubscription(),
            business_name: "Mock Business",
            owner_name: "Mock Owner",
            owner_email: "owner@mock.com",
            payment_status: "verified"
        }));
        return HttpResponse.json({ data: subscriptions, count: 5 });
    }),

    http.get(`${APP_URL}/api/admin/subscriptions/stats`, () => {
        return HttpResponse.json({
            stats: { 
                active: 10, total_revenue: 5000, 
                revenue_growth: 15, prev_revenue: 4347 
            },
            plan_breakdown: [
                { plan_type: "basic", count: 5, revenue: 1000 },
                { plan_type: "premium", count: 3, revenue: 1800 },
                { plan_type: "featured", count: 2, revenue: 2200 }
            ]
        });
    }),

    http.get(`${APP_URL}/api/admin/subscriptions/:id`, ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                ...factories.createMockSubscription({ id: params.id as string }),
                business_name: "Mock Business",
                owner: { full_name: "Mock Owner", email: "owner@mock.com" },
                listing: { id: "list-1", business_name: "Mock Business" },
                history: [],
                payments: []
            }
        });
    }),

    http.post(`${APP_URL}/api/admin/subscriptions/bulk`, () => {
        return HttpResponse.json({ success: true, processed: 5, failures: [] });
    }),

    // Admin Top Search
    http.get(`${APP_URL}/api/admin/top-search`, () => {
        return HttpResponse.json({
            data: Array.from({ length: 3 }).map(() => factories.createMockTopSearchPlacement()),
            active_count: 3,
            expired_count: 0
        });
    }),

    http.get(`${APP_URL}/api/admin/top-search/overview`, () => {
        return HttpResponse.json({
            success: true,
            data: [
                {
                    category: { id: "cat-1", name: "Restaurants" },
                    slots: [
                        { position: 1, placement: factories.createMockTopSearchPlacement(), listing: { business_name: "Starbucks" } },
                        { position: 2, placement: null, listing: null },
                        { position: 3, placement: null, listing: null }
                    ]
                }
            ]
        });
    }),

    http.post(`${APP_URL}/api/admin/top-search`, () => {
        return HttpResponse.json({ success: true }, { status: 201 });
    }),

    http.get(`${APP_URL}/api/admin/top-search/stats`, () => {
        return HttpResponse.json({
            active_placements: 5,
            total_available_slots: 25,
            revenue_this_month: 2500,
            expiring_this_week: 1,
            by_category: []
        });
    }),
];
