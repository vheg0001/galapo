import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { fetchPublicEvents, type EventPeriod, type EventTypeFilter } from "@/lib/event-helpers";

export const dynamic = "force-dynamic";

function parseIntParam(value: string | null, fallback: number) {
    const parsed = Number.parseInt(value || "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { searchParams } = new URL(request.url);

        const period = (searchParams.get("period") || "upcoming") as EventPeriod;
        const type = (searchParams.get("type") || "all") as EventTypeFilter;
        const category = searchParams.get("category");
        const barangay = searchParams.get("barangay");
        const search = searchParams.get("search");
        const featuredOnly = searchParams.get("featured_only") === "true";
        const month = searchParams.get("month") ? parseIntParam(searchParams.get("month"), 0) : null;
        const year = searchParams.get("year") ? parseIntParam(searchParams.get("year"), 0) : null;
        const page = parseIntParam(searchParams.get("page"), 1);
        const limit = parseIntParam(searchParams.get("limit"), 20);

        const result = await fetchPublicEvents(supabase, {
            period,
            type,
            category,
            barangay,
            search,
            featuredOnly,
            month,
            year,
            page,
            limit,
        });

        return NextResponse.json({
            data: result.data,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
                hasNextPage: result.page < result.totalPages,
                hasPrevPage: result.page > 1,
            },
            filters_applied: result.filtersApplied,
        });
    } catch (error: any) {
        console.error("[api/events GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
    }
}