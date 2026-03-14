import { NextRequest, NextResponse } from "next/server";
import { getTopSearchAvailability } from "@/lib/subscription-route-helpers";

/**
 * GET /api/business/top-search/availability
 * Check top search slot availability for a category.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");

    if (!categoryId) {
        return NextResponse.json({ error: "category_id is required" }, { status: 400 });
    }

    try {
        const availability = await getTopSearchAvailability(categoryId);
        return NextResponse.json(availability);
    } catch (error: any) {
        if (error.status) return NextResponse.json({ error: error.message }, { status: error.status });
        console.error("GET /api/business/top-search/availability error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}