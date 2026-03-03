import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

/**
 * GET /api/business/listings/[id]/images
 * Fetch all gallery images for a listing
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
        const { data, error } = await supabase
            .from("listing_images")
            .select("*")
            .eq("listing_id", id)
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/business/listings/[id]/images
 * Upload new image(s) to a listing
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();
        const formData = await req.formData();
        const files = formData.getAll("images") as File[];

        if (files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // Check current image count
        const { count } = await supabase
            .from("listing_images")
            .select("*", { count: "exact", head: true })
            .eq("listing_id", id);

        if ((count || 0) + files.length > 10) {
            return NextResponse.json({ error: "Maximum 10 images allowed per listing" }, { status: 400 });
        }

        const results = [];
        for (const file of files) {
            // Validate file
            if (!file.type.startsWith("image/")) continue;
            if (file.size > 5 * 1024 * 1024) continue;

            const fileExt = file.name.split(".").pop();
            const fileName = `${id}/${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("listings")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("listings")
                .getPublicUrl(fileName);

            // Insert into DB
            const { data: galleryItem, error: dbError } = await supabase
                .from("listing_images")
                .insert({
                    listing_id: id,
                    image_url: publicUrl,
                    sort_order: (count || 0) + results.length,
                    is_primary: (count || 0) + results.length === 0,
                })
                .select()
                .single();

            if (dbError) throw dbError;
            results.push(galleryItem);
        }

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/business/listings/[id]/images
 * Reorder gallery images
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

        const body = await req.json(); // Expected: [{ id, sort_order }]
        const supabase = await createServerSupabaseClient();

        for (const item of body) {
            await supabase
                .from("listing_images")
                .update({ sort_order: item.sort_order })
                .eq("id", item.id)
                .eq("listing_id", id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/business/listings/[id]/images
 * Delete a gallery image
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("image_id");

    if (!imageId) {
        return NextResponse.json({ error: "Missing image_id" }, { status: 400 });
    }

    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        // 1. Get image info to find storage path
        const { data: image, error: fetchError } = await supabase
            .from("listing_images")
            .select("*")
            .eq("id", imageId)
            .eq("listing_id", id)
            .single();

        if (fetchError || !image) {
            return NextResponse.json({ error: "Image not found" }, { status: 404 });
        }

        // 2. Delete from Storage
        const path = image.image_url.split("/").slice(-2).join("/"); // assuming path is listing_id/filename
        await supabase.storage.from("listings").remove([path]);

        // 3. Delete from DB
        const { error: deleteError } = await supabase
            .from("listing_images")
            .delete()
            .eq("id", imageId);

        if (deleteError) throw deleteError;

        // 4. Update primary image if deleted was primary
        if (image.is_primary) {
            const { data: nextImage } = await supabase
                .from("listing_images")
                .select("*")
                .eq("listing_id", id)
                .order("sort_order", { ascending: true })
                .limit(1)
                .single();

            if (nextImage) {
                await supabase
                    .from("listing_images")
                    .update({ is_primary: true })
                    .eq("id", nextImage.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
