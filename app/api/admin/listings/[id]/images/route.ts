import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;

    try {
        const admin = createAdminSupabaseClient();
        const formData = await request.formData();
        const files = formData.getAll("images") as File[];

        if (files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        const imageUrls: string[] = [];
        for (const file of files) {
            if (!file.type.startsWith("image/")) continue;
            if (file.size > 5 * 1024 * 1024) continue;

            const ext = file.name.split(".").pop() || "jpg";
            const filePath = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { error: uploadError } = await admin.storage
                .from("listings")
                .upload(filePath, file, { upsert: false, contentType: file.type });
            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = admin.storage.from("listings").getPublicUrl(filePath);
            imageUrls.push(publicUrl);
        }

        return NextResponse.json({ image_urls: imageUrls });
    } catch (error: any) {
        console.error("[admin/listings/[id]/images POST]", error);
        return NextResponse.json({ error: error.message ?? "Failed to upload images" }, { status: 500 });
    }
}

