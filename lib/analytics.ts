import { AnalyticsEventType } from "./types";

/**
 * Client-safe contact click tracking.
 * Performs a fetch to the API route to record the event.
 */
export async function trackContactClick(
    listingSlug: string,
    eventType: AnalyticsEventType,
    eventData?: Record<string, any>
) {
    try {
        // Map enum to a shorter string for the API if necessary, 
        // but here we send the type directly as the API expects.
        let typeStr = "";
        switch (eventType) {
            case AnalyticsEventType.PHONE_CLICK: typeStr = "phone"; break;
            case AnalyticsEventType.EMAIL_CLICK: typeStr = "email"; break;
            case AnalyticsEventType.WEBSITE_CLICK: typeStr = "website"; break;
            case AnalyticsEventType.DIRECTIONS_CLICK: typeStr = "directions"; break;
            case AnalyticsEventType.SOCIAL_CLICK: typeStr = "social"; break;
            case AnalyticsEventType.SHARE: typeStr = "share"; break;
            default: typeStr = "other";
        }

        await fetch(`/api/listings/${listingSlug}/contact-click`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: typeStr,
                data: eventData,
            }),
        });
    } catch (err) {
        console.error("Failed to track contact click (client):", err);
    }
}

/**
 * Placeholder for page view tracking from client if ever needed.
 * Normally handled by the server on page load.
 */
export async function trackPageView(listingSlug: string) {
    // Usually handled by GET /api/listings/[slug] or server component
    console.log("Client-side page view tracking not implemented - use server-side tracking");
}
