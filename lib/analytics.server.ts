import { cookies } from "next/headers";
import { createServerSupabaseClient } from "./supabase";
import { AnalyticsEventType } from "./types";

/**
 * Get or generate a visitor ID from cookies.
 * Should only be called from Server Components or API routes.
 */
export async function getVisitorIdServer(): Promise<string> {
    const cookieStore = await cookies();
    let visitorId = cookieStore.get("visitor_id")?.value;

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        // Set cookie for 1 year
        cookieStore.set("visitor_id", visitorId, {
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
        });
    }

    return visitorId as string;
}

/**
 * Track a page view event from the server.
 */
export async function trackPageViewServer(listingId: string, visitorId?: string) {
    const supabase = await createServerSupabaseClient();
    const vid = visitorId || (await getVisitorIdServer());

    const { error } = await supabase.from("listing_analytics").insert({
        listing_id: listingId,
        event_type: AnalyticsEventType.PAGE_VIEW,
        visitor_id: vid,
    });

    if (error) {
        console.error("Error tracking page view (server):", error);
    }
}

/**
 * Track a contact click event from the server.
 */
export async function trackContactClickServer(
    listingId: string,
    eventType: AnalyticsEventType,
    eventData?: Record<string, any>,
    visitorId?: string
) {
    const supabase = await createServerSupabaseClient();
    const vid = visitorId || (await getVisitorIdServer());

    const { error } = await supabase.from("listing_analytics").insert({
        listing_id: listingId,
        event_type: eventType,
        event_data: eventData,
        visitor_id: vid,
    });

    if (error) {
        console.error("Error tracking contact click (server):", error);
    }
}
