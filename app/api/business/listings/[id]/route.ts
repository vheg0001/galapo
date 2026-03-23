import { NextRequest, NextResponse } from "next/server";
import {
    createServerSupabaseClient,
    createAdminSupabaseClient
} from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";
import {
    detectCriticalChanges,
    generateUniqueSlug,
    validateListingData,
    formatOperatingHours
} from "@/lib/listing-helpers";

/**
 * GET /api/business/listings/[id]
 * Fetch a single listing with images, dynamic field values, and category info
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        const { data: listing, error } = await supabase
            .from("listings")
            .select(`
                *,
                categories!category_id(id, name, slug, icon),
                subcategory:categories!subcategory_id(id, name, slug),
                barangay:barangays!barangay_id(id, name, slug),
                images:listing_images(id, image_url, alt_text, sort_order, is_primary),
                field_values:listing_field_values(id, field_id, value)
            `)
            .eq("id", id)
            .eq("owner_id", session.user.id)
            .single();

        if (error) throw error;
        if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

        return NextResponse.json(listing);
    } catch (error: any) {
        console.error("[LISTING_GET] Unexpected error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            debug: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}

/**
 * PUT /api/business/listings/[id]
 * Update a listing; critical field changes trigger re-review
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { is_draft = false, dynamic_fields = [], ...updateData } = body;
        const supabase = await createServerSupabaseClient();

        // 1. Fetch current listing to compare
        const { data: current, error: fetchError } = await supabase
            .from("listings")
            .select("*")
            .eq("id", id)
            .eq("owner_id", session.user.id)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // 2. Validate data
        // Merge current data with update data for a complete record to validate
        const validationData = { ...current, ...updateData };

        const { data: categoryFields } = await supabase
            .from("category_fields")
            .select("*")
            .eq("category_id", validationData.category_id)
            .eq("is_active", true);

        const { isValid, errors } = validateListingData(validationData, categoryFields || []);
        if (!isValid && !is_draft) {
            return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
        }

        // 3. Detect critical changes
        const criticalChanged = detectCriticalChanges(current, updateData);

        // 4. Handle slug regeneration if name changed
        if (updateData.business_name && updateData.business_name !== current.business_name) {
            const { data: existingSlugs } = await supabase
                .from("listings")
                .select("slug")
                .neq("id", id)
                .ilike("slug", `${updateData.business_name.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")}%`);

            updateData.slug = generateUniqueSlug(updateData.business_name, (existingSlugs || []).map(s => s.slug));
        }

        const updatePayload: any = {
            ...updateData,
            updated_at: new Date().toISOString(),
        };

        // Remove fields that shouldn't be updated directly
        delete updatePayload.id;
        delete updatePayload.owner_id;
        delete updatePayload.created_at;

        if (is_draft) {
            updatePayload.status = "draft";
        } else if (criticalChanged && current.status === "approved") {
            updatePayload.status = "pending";
        }

        if (updateData.operating_hours) {
            updatePayload.operating_hours = formatOperatingHours(updateData.operating_hours);
        }

        // 5. Update listing
        const { data, error: updateError } = await supabase
            .from("listings")
            .update(updatePayload)
            .eq("id", id)
            .eq("owner_id", session.user.id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 6. Update dynamic fields (upsert)
        if (dynamic_fields.length > 0) {
            for (const df of dynamic_fields) {
                await supabase
                    .from("listing_field_values")
                    .upsert({
                        listing_id: id,
                        field_id: df.field_id,
                        value: df.value,
                        updated_at: new Date().toISOString()
                    }, { onConflict: "listing_id,field_id" });
            }
        }

        // 7. Notify admin if critical changes were made
        if (criticalChanged && current.status === "approved") {
            const adminClient = createAdminSupabaseClient();
            const { data: admin } = await adminClient
                .from("profiles")
                .select("id")
                .eq("role", "super_admin")
                .limit(1)
                .single();

            if (admin) {
                await adminClient.from("notifications").insert({
                    user_id: admin.id,
                    type: "listing_approved", // This matches the previous logic, though maybe a more specific type is needed
                    title: "Listing updated and needs re-approval",
                    message: `Listing "${data.business_name}" updated critical fields and needs review.`,
                    data: { listing_id: id, slug: data.slug }
                });
            }
        }

        return NextResponse.json({ data, critical_changed: criticalChanged });
    } catch (error: any) {
        console.error("[LISTING_PUT] Unexpected error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            debug: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}

/**
 * DELETE /api/business/listings/[id]
 * Soft-delete a listing
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        // Check if listing is a draft
        const { data: listing, error: fetchError } = await supabase
            .from("listings")
            .select("status")
            .eq("id", id)
            .eq("owner_id", session.user.id)
            .single();

        if (fetchError || !listing) {
            console.log("[LISTING_DELETE] Fetch failed or not authorized:", { id, error: fetchError });
            return NextResponse.json({ error: "Listing not found or not authorized to delete" }, { status: 404 });
        }

        if (listing.status === "draft") {
            // Hard delete drafts
            const { error: deleteError } = await supabase
                .from("listings")
                .delete()
                .eq("id", id)
                .eq("owner_id", session.user.id);

            console.log("[LISTING_DELETE] Hard delete result:", { id, error: deleteError });
            if (deleteError) throw deleteError;
        } else {
            // Soft delete active/pending listings
            const { error: updateError } = await supabase
                .from("listings")
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq("id", id)
                .eq("owner_id", session.user.id);

            console.log("[LISTING_DELETE] Soft delete result:", { id, error: updateError });
            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[LISTING_DELETE]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
