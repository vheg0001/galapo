import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { uploadBlogImageFromFormData } from "@/lib/blog-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const formData = await request.formData();
        const result = await uploadBlogImageFromFormData(formData);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to upload blog image" }, { status: 500 });
    }
}