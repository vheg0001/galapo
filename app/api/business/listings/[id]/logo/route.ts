import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

/**
 * POST /api/business/listings/[id]/logo
 * Upload or replace a business logo
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
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${id}/logo-${Date.now()}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from("listings")
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("listings")
            .getPublicUrl(fileName);

        // 3. Update listing record
        const { error: dbError } = await supabase
            .from("listings")
            .update({ logo_url: publicUrl })
            .eq("id", id)
            .eq("owner_id", session.user.id);

        if (dbError) throw dbError;

        return NextResponse.json({ logo_url: publicUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
