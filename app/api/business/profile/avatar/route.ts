import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/business/profile/avatar
 * Uploads an avatar image to Supabase Storage
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

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Validation
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
        }

        const ext = file.name.split(".").pop();
        const fileName = `${user.id}.${ext}`;
        const filePath = `avatars/${fileName}`;

        // 2. Upload to "logos" bucket (per requirements)
        // Note: Using admin client if storage RLS is restrictive, or standard client if configured
        // Requirements say upload to "logos" bucket
        const { error: uploadError } = await supabase.storage
            .from("logos")
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) throw uploadError;

        // 3. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("logos")
            .getPublicUrl(filePath);

        // Optional: Update the profile's avatar_url in DB automatically here?
        // Let's just return the URL and let the client handle the profile update if needed
        // as per many headless upload patterns.

        return NextResponse.json({ public_url: publicUrl });
    } catch (error: any) {
        console.error("[AVATAR_POST]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
