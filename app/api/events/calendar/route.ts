import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { fetchCalendarEvents } from "@/lib/event-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const now = new Date();
        const month = Number.parseInt(searchParams.get("month") || `${now.getMonth() + 1}`, 10);
        const year = Number.parseInt(searchParams.get("year") || `${now.getFullYear()}`, 10);
        const supabase = await createServerSupabaseClient();

        const events = await fetchCalendarEvents(supabase, month, year);
        const grouped = events.reduce<Record<string, {
            count: number; events: Array<{
                id: string;
                title: string;
                slug: string;
                start_time: string;
                is_city_wide: boolean;
                is_featured: boolean;
            }>
        }>>((acc, event) => {
            const key = event.event_date.split("T")[0];
            if (!acc[key]) {
                acc[key] = { count: 0, events: [] };
            }
            acc[key].count += 1;
            acc[key].events.push({
                id: event.id,
                title: event.title,
                slug: event.slug,
                start_time: event.start_time,
                is_city_wide: event.is_city_wide,
                is_featured: event.is_featured,
            });
            return acc;
        }, {});

        return NextResponse.json(grouped);
    } catch (error: any) {
        console.error("[api/events/calendar GET]", error);
        return NextResponse.json({ error: error.message || "Failed to fetch calendar events" }, { status: 500 });
    }
}