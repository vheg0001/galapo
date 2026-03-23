import { NextRequest, NextResponse } from "next/server";
import { getPublishedBlogPosts } from "@/lib/blog-helpers";

export const revalidate = 600;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const result = await getPublishedBlogPosts({
            tag: searchParams.get("tag"),
            search: searchParams.get("search"),
            featured: searchParams.get("featured") === "true",
            page: Number(searchParams.get("page") || 1),
            limit: Number(searchParams.get("limit") || 10),
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch blog posts" }, { status: 500 });
    }
}