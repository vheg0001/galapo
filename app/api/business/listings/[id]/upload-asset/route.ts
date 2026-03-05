import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";

/**
 * POST /api/business/listings/[id]/upload-asset
 * General purpose asset upload for a listing (dynamic fields, etc.)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: listingId } = await params;
    try {
        const auth = await requireBusinessOwner(req);
        if ("error" in auth) return auth.error;
        const { profile, user } = auth;

        const { createAdminSupabaseClient } = await import("@/lib/supabase");
        const adminSupabase = createAdminSupabaseClient();

        // 1. Verify ownership (Admins can upload for any listing)
        if (profile.role !== "super_admin") {
            const { data: listing, error: fetchError } = await adminSupabase
                .from("listings")
                .select("id")
                .eq("id", listingId)
                .eq("owner_id", user.id)
                .single();

            if (fetchError || !listing) {
                return NextResponse.json({ error: "Listing not found or access denied" }, { status: 404 });
            }
        }

        // 2. Extract file from FormData
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
        }

        // 3. Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${listingId}/assets/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

        const buffer = await file.arrayBuffer();
        const { error: uploadError } = await adminSupabase.storage
            .from("listings")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error("[UPLOAD_ASSET] Storage error:", uploadError);
            throw uploadError;
        }

        // 4. Get public URL
        const { data: { publicUrl } } = adminSupabase.storage
            .from("listings")
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error("[UPLOAD_ASSET_POST] General error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
