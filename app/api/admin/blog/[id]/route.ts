import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { deleteAdminBlogPost, getAdminBlogPostById, updateAdminBlogPost } from "@/lib/blog-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const post = await getAdminBlogPostById(id);
    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ data: post });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        const body = await request.json();
        const post = await updateAdminBlogPost(id, body);
        return NextResponse.json({ data: post });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to update blog post" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { id } = await params;
        await deleteAdminBlogPost(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to delete blog post" }, { status: 500 });
    }
}