import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function isClickEvent(eventType: string) {
    return [
        "phone_click",
        "email_click",
        "website_click",
        "directions_click",
        "direction_click",
        "social_click",
        "share",
    ].includes(eventType);
}

function extractStoragePath(url: string | null | undefined, bucket: string) {
    if (!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
}

async function logAdminActivityIfAvailable(admin: ReturnType<typeof createAdminSupabaseClient>, payload: Record<string, any>) {
    const { error } = await admin.from("admin_activity").insert(payload);
    if (error && error.code !== "42P01") {
        console.error("[admin/listings] admin_activity insert failed", error);
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { data: listing, error: listingError } = await admin
            .from("listings")
            .select(
                `
                *,
                categories!listings_category_id_fkey(id, name, slug, parent_id),
                subcategory:categories!listings_subcategory_id_fkey(id, name, slug),
                barangays!listings_barangay_id_fkey(id, name, slug),
                cities!listings_city_id_fkey(id, name, slug),
                profiles!listings_owner_id_fkey(id, full_name, email, phone, created_at)
            `
            )
            .eq("id", id)
            .single();

        if (listingError) throw listingError;
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        const [
            imagesRes,
            fieldsRes,
            dealsRes,
            eventsRes,
            subscriptionRes,
            paymentsRes,
            analyticsRes,
            notesRes,
            ownerListingCountRes,
        ] = await Promise.all([
            admin
                .from("listing_images")
                .select("id, listing_id, image_url, alt_text, sort_order, is_primary, created_at")
                .eq("listing_id", id)
                .order("sort_order", { ascending: true }),
            admin
                .from("listing_field_values")
                .select("id, listing_id, field_id, value, created_at, updated_at, category_fields(id, field_name, field_label, field_type, sort_order, options)")
                .eq("listing_id", id),
            admin
                .from("deals")
                .select("*")
                .eq("listing_id", id)
                .order("created_at", { ascending: false }),
            admin
                .from("events")
                .select("*")
                .eq("listing_id", id)
                .order("event_date", { ascending: true }),
            admin
                .from("subscriptions")
                .select("*")
                .eq("listing_id", id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            admin
                .from("payments")
                .select("*")
                .eq("listing_id", id)
                .order("created_at", { ascending: false }),
            admin
                .from("listing_analytics")
                .select("event_type, created_at")
                .eq("listing_id", id),
            admin
                .from("admin_notes")
                .select("id, note, created_at, admin_id, profiles!admin_notes_admin_id_fkey(full_name, email)")
                .eq("listing_id", id)
                .order("created_at", { ascending: false }),
            listing.owner_id
                ? admin.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", listing.owner_id)
                : Promise.resolve({ count: 0, error: null } as any),
        ]);

        if (imagesRes.error) throw imagesRes.error;
        if (fieldsRes.error) throw fieldsRes.error;
        if (dealsRes.error) throw dealsRes.error;
        if (eventsRes.error) throw eventsRes.error;
        if (subscriptionRes.error) throw subscriptionRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (analyticsRes.error) throw analyticsRes.error;
        if (notesRes.error && notesRes.error.code !== "42P01") throw notesRes.error;
        if (ownerListingCountRes.error) throw ownerListingCountRes.error;

        const allEvents = analyticsRes.data ?? [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const summary = {
            total_views: 0,
            views_this_month: 0,
            total_clicks: 0,
            clicks_this_month: 0,
            phone_clicks: 0,
            email_clicks: 0,
            website_clicks: 0,
            directions_clicks: 0,
            social_clicks: 0,
            share_clicks: 0,
        };

        allEvents.forEach((event: any) => {
            const eventType = String(event.event_type);
            const createdAt = new Date(event.created_at);
            const thisMonth = createdAt >= startOfMonth;

            if (eventType === "page_view") {
                summary.total_views += 1;
                if (thisMonth) summary.views_this_month += 1;
                return;
            }

            if (isClickEvent(eventType)) {
                summary.total_clicks += 1;
                if (thisMonth) summary.clicks_this_month += 1;
            }
            if (eventType === "phone_click") summary.phone_clicks += 1;
            if (eventType === "email_click") summary.email_clicks += 1;
            if (eventType === "website_click") summary.website_clicks += 1;
            if (eventType === "directions_click" || eventType === "direction_click") summary.directions_clicks += 1;
            if (eventType === "social_click") summary.social_clicks += 1;
            if (eventType === "share") summary.share_clicks += 1;
        });

        const claimInfo = listing.status === "claimed_pending"
            ? {
                claimed_at: listing.claimed_at,
                claim_proof_url: listing.claim_proof_url,
                claimant: listing.profiles ?? null,
            }
            : null;

        return NextResponse.json({
            listing,
            owner_profile: listing.profiles ?? null,
            owner_total_listings: ownerListingCountRes.count ?? 0,
            images: imagesRes.data ?? [],
            dynamic_field_values: fieldsRes.data ?? [],
            deals: dealsRes.data ?? [],
            events: eventsRes.data ?? [],
            current_subscription: subscriptionRes.data ?? null,
            payment_history: paymentsRes.data ?? [],
            analytics_summary: summary,
            claim_info: claimInfo,
            admin_notes: notesRes.data ?? [],
        });
    } catch (error: any) {
        console.error("[admin/listings/[id] GET]", error);
        return NextResponse.json({ error: error.message ?? "Failed to load listing" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const dynamicFields =
            body?.dynamic_fields && typeof body.dynamic_fields === "object"
                ? body.dynamic_fields
                : null;
        const imageUrls = Array.isArray(body?.image_urls)
            ? body.image_urls.filter((u: any) => typeof u === "string" && u.trim())
            : null;

        const updatePayload: Record<string, any> = {
            ...body,
            updated_at: new Date().toISOString(),
        };
        delete updatePayload.id;
        delete updatePayload.created_at;
        delete updatePayload.dynamic_fields;
        delete updatePayload.image_urls;
        // Strip out relation fields that might be left in the payload by the frontend
        delete updatePayload.categories;
        delete updatePayload.subcategory;
        delete updatePayload.barangays;
        delete updatePayload.cities;
        delete updatePayload.profiles;
        delete updatePayload.events;
        delete updatePayload.deals;
        delete updatePayload.views;
        delete updatePayload.clicks;
        delete updatePayload.reviews;
        delete updatePayload.owner;

        // Convert empty strings to null ONLY for foreign key columns (UUID types in Supabase)
        // This avoids "invalid input syntax for type uuid: ''" while respecting NOT NULL constraints on text fields
        for (const key of Object.keys(updatePayload)) {
            if (updatePayload[key] === "" && key.endsWith("_id")) {
                updatePayload[key] = null;
            }
        }

        if ("owner_id" in updatePayload) {
            updatePayload.is_pre_populated = !updatePayload.owner_id;
        }

        const { data, error } = await admin.from("listings").update(updatePayload).eq("id", id).select("*").single();
        if (error) {
            console.error("[admin/listings/[id] PUT] listings.update error:", error);
            throw error;
        }

        if (dynamicFields !== null) {
            const dynamicEntries = Object.entries(dynamicFields)
                .filter(([fieldId, value]) => !!fieldId && value !== undefined && value !== null && value !== "")
                .map(([fieldId, value]) => ({ listing_id: id, field_id: fieldId, value }));

            const { error: deleteDynamicError } = await admin.from("listing_field_values").delete().eq("listing_id", id);
            if (deleteDynamicError) {
                console.error("[admin/listings/[id] PUT] listing_field_values.delete error:", deleteDynamicError);
                throw deleteDynamicError;
            }
            if (dynamicEntries.length > 0) {
                const { error: insertDynamicError } = await admin.from("listing_field_values").insert(dynamicEntries);
                if (insertDynamicError) {
                    console.error("[admin/listings/[id] PUT] listing_field_values.insert error:", insertDynamicError, "Entries:", dynamicEntries);
                    throw insertDynamicError;
                }
            }
        }

        if (imageUrls !== null) {
            const { error: deleteImagesError } = await admin.from("listing_images").delete().eq("listing_id", id);
            if (deleteImagesError) {
                console.error("[admin/listings/[id] PUT] listing_images.delete error:", deleteImagesError);
                throw deleteImagesError;
            }
            if (imageUrls.length > 0) {
                const imageRows = imageUrls.map((image_url: string, idx: number) => ({
                    listing_id: id,
                    image_url,
                    alt_text: data.business_name ?? null,
                    sort_order: idx,
                    is_primary: idx === 0,
                }));
                const { error: insertImagesError } = await admin.from("listing_images").insert(imageRows);
                if (insertImagesError) {
                    console.error("[admin/listings/[id] PUT] listing_images.insert error:", insertImagesError, "Rows:", imageRows);
                    throw insertImagesError;
                }
            }
        }

        await logAdminActivityIfAvailable(admin, {
            admin_id: auth.userId,
            entity_type: "listing",
            entity_id: id,
            action: "update",
            metadata: { updated_fields: Object.keys(updatePayload) },
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[admin/listings/[id] PUT]", error);
        return NextResponse.json({ error: error.message ?? "Failed to save listing" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json().catch(() => ({}));
        const action = String(body.action ?? "");
        const reason = String(body.reason ?? "").trim();

        const { data: listing, error: listingError } = await admin
            .from("listings")
            .select("id, business_name, status, is_active, is_featured")
            .eq("id", id)
            .single();
        if (listingError) throw listingError;
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (action === "toggle_active") {
            updatePayload.is_active = !listing.is_active;
        } else if (action === "toggle_featured") {
            updatePayload.is_featured = !listing.is_featured;
        } else if (action === "approve") {
            if (!["pending", "claimed_pending"].includes(listing.status)) {
                return NextResponse.json({ error: "Only pending listings can be approved." }, { status: 409 });
            }
            updatePayload.status = "approved";
            updatePayload.is_active = true;
        } else if (action === "reject") {
            if (!["pending", "claimed_pending"].includes(listing.status)) {
                return NextResponse.json({ error: "Only pending listings can be rejected." }, { status: 409 });
            }
            if (!reason) {
                return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
            }

            // If it's a claim rejection, it should revert to approved (pre-populated) NOT hidden
            if (listing.status === "claimed_pending") {
                updatePayload.status = "approved";
                updatePayload.owner_id = null;
                updatePayload.claim_proof_url = null;
                updatePayload.claimed_at = null;
            } else {
                updatePayload.status = "rejected";
            }
            updatePayload.rejection_reason = reason;
        } else {
            return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
        }

        const { data, error } = await admin.from("listings").update(updatePayload).eq("id", id).select("*").single();
        if (error) throw error;

        await logAdminActivityIfAvailable(admin, {
            admin_id: auth.userId,
            entity_type: "listing",
            entity_id: id,
            action,
            metadata: {
                reason: reason || null,
                business_name: listing.business_name,
            },
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[admin/listings/[id] PATCH]", error);
        return NextResponse.json({ error: error.message ?? "Failed to apply action" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { searchParams } = new URL(request.url);
        const body = await request.json().catch(() => ({}));
        const hard = searchParams.get("hard") === "true" || body.hard === true;

        if (!hard) {
            const { error } = await admin.from("listings").update({
                is_active: false,
                status: "deactivated",
                updated_at: new Date().toISOString()
            }).eq("id", id);
            if (error) throw error;

            await logAdminActivityIfAvailable(admin, {
                admin_id: auth.userId,
                entity_type: "listing",
                entity_id: id,
                action: "soft_delete",
                metadata: { status: "deactivated", is_active: false },
                created_at: new Date().toISOString(),
            });

            return NextResponse.json({ success: true, deleted: "soft" });
        }

        const confirmation = String(body.confirmation ?? searchParams.get("confirmation") ?? "");
        if (confirmation !== "DELETE") {
            return NextResponse.json(
                { error: "Hard delete requires confirmation=DELETE." },
                { status: 400 }
            );
        }

        const { data: listing, error: listingError } = await admin
            .from("listings")
            .select("id, logo_url")
            .eq("id", id)
            .single();
        if (listingError) throw listingError;

        const { data: images, error: imagesError } = await admin
            .from("listing_images")
            .select("image_url")
            .eq("listing_id", id);
        if (imagesError) throw imagesError;

        // Try extracting logo path from both potential buckets
        const logoPathListings = extractStoragePath(listing.logo_url, "listings");
        const logoPathLogos = extractStoragePath(listing.logo_url, "logos");

        const listingImagePaths = (images ?? [])
            .map((img: any) => extractStoragePath(img.image_url, "listings"))
            .filter(Boolean) as string[];

        if (logoPathLogos) {
            await admin.storage.from("logos").remove([logoPathLogos]);
        }
        if (logoPathListings) {
            await admin.storage.from("listings").remove([logoPathListings]);
        }
        if (listingImagePaths.length) {
            await admin.storage.from("listings").remove(listingImagePaths);
        }

        await Promise.all([
            admin.from("listing_field_values").delete().eq("listing_id", id),
            admin.from("listing_analytics").delete().eq("listing_id", id),
            admin.from("listing_images").delete().eq("listing_id", id),
            admin.from("deals").delete().eq("listing_id", id),
            admin.from("events").delete().eq("listing_id", id),
            admin.from("admin_notes").delete().eq("listing_id", id),
        ]);

        const { error: deleteError } = await admin.from("listings").delete().eq("id", id);
        if (deleteError) throw deleteError;

        await logAdminActivityIfAvailable(admin, {
            admin_id: auth.userId,
            entity_type: "listing",
            entity_id: id,
            action: "hard_delete",
            metadata: null,
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, deleted: "hard" });
    } catch (error: any) {
        console.error("[admin/listings/[id] DELETE]", error);
        return NextResponse.json({ error: error.message ?? "Failed to delete listing" }, { status: 500 });
    }
}
