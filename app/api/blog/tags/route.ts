import { NextResponse } from "next/server";
import { getBlogTags } from "@/lib/blog-helpers";

export const revalidate = 1800;

export async function GET() {
    try {
        const tags = await getBlogTags();
        return NextResponse.json({ data: tags });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch blog tags" }, { status: 500 });
    }
}