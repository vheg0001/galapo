import { NextRequest, NextResponse } from "next/server";
import { getBlogPostDetailBySlug } from "@/lib/blog-helpers";

export const revalidate = 600;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await params;
        const post = await getBlogPostDetailBySlug(slug, { incrementView: true });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json({ data: post });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch blog post" }, { status: 500 });
    }
}