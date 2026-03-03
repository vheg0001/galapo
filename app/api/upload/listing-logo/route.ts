import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/upload/listing-logo
 * Uploads a listing logo to the 'logos' Supabase Storage bucket and updates the listing
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

        if (!file || !listingId) {
            return NextResponse.json({ error: "File and listing_id are required" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Logo must be less than 2MB" }, { status: 400 });
        }

        const ext = file.name.split(".").pop();
        const fileName = `listings/${listingId}/logo.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("logos")
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from("logos")
            .getPublicUrl(fileName);

        // Update listing's logo_url
        const { error: updateError } = await supabase
            .from("listings")
            .update({ logo_url: publicUrl })
            .eq("id", listingId)
            .eq("owner_id", user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ public_url: publicUrl });
    } catch (error: any) {
        console.error("[UPLOAD_LISTING_LOGO]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
