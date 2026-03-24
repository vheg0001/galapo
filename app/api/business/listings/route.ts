import { NextResponse } from "next/server";
import {
    createServerSupabaseClient,
    createAdminSupabaseClient
} from "@/lib/supabase";
import {
    generateUniqueSlug,
    validateListingData,
    formatOperatingHours
} from "@/lib/listing-helpers";

/**
 * GET /api/business/listings
 * Fetch all listings owned by the authenticated business owner
 */
export async function GET(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get("page");
        const limitParam = searchParams.get("limit");

        const page = Math.max(1, parseInt(pageParam || "1") || 1);
        const limit = Math.max(1, Math.min(100, parseInt(limitParam || "20") || 20));
        const offset = (page - 1) * limit;

        // 1. Fetch listings with basic info and relationships
        const { data: listings, error: listingsError, count } = await supabase
            .from("listings")
            .select(`
                *,
                categories!category_id(name),
                subcategory:categories!subcategory_id(name),
                primary_image:listing_images(image_url)
            `, { count: "exact" })
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (listingsError) throw listingsError;
        if (!listings || listings.length === 0) {
            return NextResponse.json({ data: [], total: 0 });
        }

        // 2. Fetch monthly analytics per listing
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const listingIds = listings.map(l => l.id);
        const { data: analytics, error: analyticsError } = await supabase
            .from("listing_analytics")
            .select("listing_id, event_type")
            .in("listing_id", listingIds)
            .gte("created_at", startOfMonth);

        if (analyticsError) throw analyticsError;

        // 3. Map analytics back to listings
        const enrichedListings = listings.map(l => {
            const listingAnalytics = analytics?.filter(a => a.listing_id === l.id) || [];
            return {
                ...l,
                category_name: l.categories?.name || "Uncategorized",
                subcategory_name: l.subcategory?.name || null,
                primary_image: l.primary_image?.[0]?.image_url || null,
                views_this_month: listingAnalytics.filter(a => a.event_type === "page_view").length,
                clicks_this_month: listingAnalytics.filter(a => a.event_type !== "page_view").length,
                current_plan: l.is_premium ? "premium" : (l.is_featured ? "featured" : "free")
            };
        });

        return NextResponse.json({
            data: enrichedListings,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
            hasNextPage: offset + limit < (count || 0),
            hasPrevPage: page > 1
        });

    } catch (error: any) {
        console.error("[LISTINGS_GET] Unexpected error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            debug: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}

/**
 * POST /api/business/listings
 * Create a new business listing
 */
export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { is_draft = false, dynamic_fields = [], ...coreData } = body;

        // 1. Fetch category fields for validation (if not a draft)
        let categoryFields: any[] = [];
        if (!is_draft) {
            const { data: fields } = await supabase
                .from("category_fields")
                .select("*")
                .eq("category_id", coreData.category_id)
                .eq("is_active", true);
            categoryFields = fields || [];
        }

        // 2. Validate data
        const { isValid, errors } = validateListingData(coreData, is_draft ? [] : categoryFields);
        if (!isValid && !is_draft) {
            return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
        }

        // 3. Generate unique slug
        let slug = "";
        if (coreData.business_name) {
            const { data: existingSlugs } = await supabase
                .from("listings")
                .select("slug")
                .ilike("slug", `${coreData.business_name.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")}%`);

            slug = generateUniqueSlug(coreData.business_name, (existingSlugs || []).map(s => s.slug));
        } else if (is_draft) {
            slug = `draft-${Math.random().toString(36).substring(2, 7)}-${Date.now()}`;
        } else {
            // Should be caught by validation, but as a fallback
            slug = `listing-${Math.random().toString(36).substring(2, 7)}-${Date.now()}`;
        }

        // 4. Prepare listing record
        const listingRecord = {
            owner_id: user.id,
            city_id: "c0000000-0000-0000-0000-000000000001", // Olongapo City
            barangay_id: coreData.barangay_id,
            category_id: coreData.category_id,
            subcategory_id: coreData.subcategory_id,
            business_name: coreData.business_name,
            slug,
            address: coreData.address,
            lat: coreData.lat,
            lng: coreData.lng,
            phone: coreData.phone,
            phone_secondary: coreData.phone_secondary,
            email: coreData.email,
            website: coreData.website,
            social_links: coreData.social_links || {},
            operating_hours: formatOperatingHours(coreData.operating_hours),
            short_description: coreData.short_description,
            full_description: coreData.full_description,
            tags: coreData.tags || [],
            payment_methods: coreData.payment_methods || [],
            status: is_draft ? "draft" : "pending",
            is_active: true,
            is_pre_populated: false,
        };

        // 5. Insert listing
        const { data: newListing, error: insertError } = await supabase
            .from("listings")
            .insert(listingRecord)
            .select()
            .single();

        if (insertError) throw insertError;

        // 6. Insert dynamic fields
        if (dynamic_fields.length > 0) {
            const fieldValues = dynamic_fields.map((df: any) => ({
                listing_id: newListing.id,
                field_id: df.field_id,
                value: df.value,
            }));

            const { error: fieldsError } = await supabase
                .from("listing_field_values")
                .insert(fieldValues);

            if (fieldsError) console.error("Error inserting dynamic fields:", fieldsError);
        }

        // 7. Create notifications
        if (!is_draft) {
            // Find super admin using admin client to bypass RLS if necessary
            const adminClient = createAdminSupabaseClient();
            const { data: admin } = await adminClient
                .from("profiles")
                .select("id")
                .eq("role", "super_admin")
                .limit(1)
                .single();

            const notifications = [];

            // 1. Notify Super Admin
            if (admin) {
                notifications.push({
                    user_id: admin.id,
                    type: "new_listing_submitted",
                    title: "New listing submitted",
                    message: `New listing submitted for review: ${newListing.business_name}`,
                    data: { listing_id: newListing.id, slug: newListing.slug }
                });
            }

            // 2. Notify Business Owner
            notifications.push({
                user_id: user.id,
                type: "new_listing_submitted",
                title: "Listing submitted for review",
                message: `Your listing "${newListing.business_name}" has been submitted and is currently pending review.`,
                data: { listing_id: newListing.id, slug: newListing.slug }
            });

            await adminClient.from("notifications").insert(notifications);
        }

        return NextResponse.json({ data: newListing }, { status: 201 });

    } catch (error: any) {
        console.error("[LISTINGS_POST] Unexpected error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            debug: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}
