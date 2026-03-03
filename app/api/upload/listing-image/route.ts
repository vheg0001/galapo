import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/upload/listing-image
 * Uploads a listing photo to the 'listings' Supabase Storage bucket
 */
export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const listingId = formData.get("listing_id") as string;
        const sortOrder = parseInt(formData.get("sort_order") as string || "0", 10);

        if (!file || !listingId) {
            return NextResponse.json({ error: "File and listing_id are required" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 });
        }

        const ext = file.name.split(".").pop();
        const fileName = `${listingId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("listings")
            .upload(fileName, file, {
                upsert: false,
                contentType: file.type,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from("listings")
            .getPublicUrl(fileName);

        // Insert into listing_images table
        const { data: imageRecord, error: insertError } = await supabase
            .from("listing_images")
            .insert({
                listing_id: listingId,
                image_url: publicUrl,
                sort_order: sortOrder,
                is_primary: sortOrder === 0,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ public_url: publicUrl, image: imageRecord });
    } catch (error: any) {
        console.error("[UPLOAD_LISTING_IMAGE]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
