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

    // Auth mock handlers
    http.post(`${APP_URL}/api/auth/session`, () => {
        return HttpResponse.json({
            success: true,
            data: { user: factories.createMockUser() }
        });
    }),
];
