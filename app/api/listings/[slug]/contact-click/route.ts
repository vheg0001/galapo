import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { trackContactClickServer } from "@/lib/analytics.server";
import { AnalyticsEventType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const body = await request.json();
    const { type } = body;

    const supabase = await createServerSupabaseClient();

    // Resolve slug to ID
    const { data: listing } = await supabase
        .from("listings")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    let eventType: AnalyticsEventType;
    switch (type) {
        case "phone": eventType = AnalyticsEventType.PHONE_CLICK; break;
        case "email": eventType = AnalyticsEventType.EMAIL_CLICK; break;
        case "website": eventType = AnalyticsEventType.WEBSITE_CLICK; break;
        case "directions": eventType = AnalyticsEventType.DIRECTIONS_CLICK; break;
        case "facebook":
        case "instagram":
        case "tiktok":
            eventType = AnalyticsEventType.SOCIAL_CLICK;
            break;
        default:
            return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    await trackContactClickServer(listing.id, eventType, { platform: type });

    return NextResponse.json({ success: true });
}
