import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { autosaveAdminBlogPost } from "@/lib/blog-helpers";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const result = await autosaveAdminBlogPost(id, body);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to autosave blog post" }, { status: 500 });
    }
}