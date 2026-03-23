import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { fetchEventBySlug, fetchRelatedEvents } from "@/lib/event-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createServerSupabaseClient();

        const event = await fetchEventBySlug(supabase, slug);
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        let fullListing = null;
        if (event.listing_id) {
            const { data: listing } = await supabase
                .from("listings")
                .select(`
                    id,
                    business_name,
                    slug,
                    address,
                    lat,
                    lng,
                    phone,
                    email,
                    website,
                    short_description,
                    full_description,
                    logo_url,
                    is_featured,
                    is_premium,
                    category:categories!listings_category_id_fkey (id, name, slug),
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
                `)
                .eq("id", event.listing_id)
                .maybeSingle();

            if (listing) {
                const category = Array.isArray(listing.category) ? listing.category[0] : listing.category;
                const barangay = Array.isArray(listing.barangay) ? listing.barangay[0] : listing.barangay;
                fullListing = {
                    ...listing,
                    category: category || null,
                    barangay: barangay || null,
                    listing_badges: (listing.listing_badges || [])
                        .map((badgeRow: any) => ({ ...badgeRow, badge: badgeRow.badge }))
                        .filter((badgeRow: any) => badgeRow.badge),
                };
            }
        }

        const relatedEvents = await fetchRelatedEvents(supabase, {
            ...event,
            listing: fullListing || event.listing,
        });

        return NextResponse.json({
            data: {
                ...event,
                listing: fullListing || event.listing,
                related_events: relatedEvents,
            },
        });
    } catch (error: any) {
        console.error("[api/events/[slug] GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch event" }, { status: 500 });
    }
}