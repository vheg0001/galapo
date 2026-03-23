import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminBlogPost, listAdminBlogPosts } from "@/lib/blog-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const data = await listAdminBlogPosts({
            status: (searchParams.get("status") as "all" | "published" | "draft" | null) || "all",
            search: searchParams.get("search"),
            page: Number(searchParams.get("page") || 1),
            limit: Number(searchParams.get("limit") || 10),
        });

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch admin blog posts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const post = await createAdminBlogPost(auth.userId, body);
        return NextResponse.json({ data: post }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to create blog post" }, { status: 500 });
    }
}