import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
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
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "Logo must be less than 2MB" }, { status: 400 });
        }

        const ext = file.name.split(".").pop() || "png";
        const filePath = `${id}/logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await admin.storage
            .from("listings")
            .upload(filePath, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;

        const {
            data: { publicUrl },
        } = admin.storage.from("listings").getPublicUrl(filePath);

        return NextResponse.json({ logo_url: publicUrl });
    } catch (error: any) {
        console.error("[admin/listings/[id]/logo POST]", error);
        return NextResponse.json({ error: error.message ?? "Failed to upload logo" }, { status: 500 });
    }
}

