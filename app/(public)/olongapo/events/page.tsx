import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { fetchPublicEvents } from "@/lib/event-helpers";
import { getActiveCategories } from "@/lib/queries";
import AdSlot from "@/components/shared/AdSlot";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import Pagination from "@/components/shared/Pagination";
import EventFilterBar from "@/components/public/events/EventFilterBar";
import EventsListView from "@/components/public/events/EventsListView";
import EventsCalendarView from "@/components/public/events/EventsCalendarView";
import FeaturedEvents from "@/components/public/events/FeaturedEvents";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Events in Olongapo City | GalaPo",
    description: "Discover upcoming events, festivals, and activities in Olongapo City.",
};

interface EventsPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getStringParam(value: string | string[] | undefined, fallback = "") {
    if (Array.isArray(value)) return value[0] || fallback;
    return value || fallback;
}

function buildBasePath(searchParams: Record<string, string | string[] | undefined>) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (!value || key === "page") return;
        if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, item));
        } else {
            params.set(key, value);
        }
    });

    const query = params.toString();
    return query ? `/olongapo/events?${query}` : "/olongapo/events";
}

export default async function OlongapoEventsPage({ searchParams }: EventsPageProps) {
    const params = await searchParams;
    const supabase = await createServerSupabaseClient();

    const view = getStringParam(params.view, "list") === "calendar" ? "calendar" : "list";
    const period = getStringParam(params.period, "upcoming") as "upcoming" | "this_week" | "this_month" | "past";
    const type = getStringParam(params.type, "all") as "all" | "city" | "business";
    const category = getStringParam(params.category) || null;
    const barangay = getStringParam(params.barangay) || null;
    const search = getStringParam(params.search) || null;
    const page = Math.max(Number.parseInt(getStringParam(params.page, "1"), 10), 1);
    const month = Number.parseInt(getStringParam(params.month, `${new Date().getMonth() + 1}`), 10);
    const year = Number.parseInt(getStringParam(params.year, `${new Date().getFullYear()}`), 10);

    console.log('[EventsPage] Starting data fetch...', { view, period, type, category, barangay, search, page });
    const startTime = Date.now();

    try {
        const [categoriesRes, barangaysRes, featuredResult, listResult, calendarResult] = await Promise.all([
            getActiveCategories(supabase, true),
            supabase.from("barangays").select("id, name, slug").order("name", { ascending: true }),
            fetchPublicEvents(supabase, { period: "upcoming", featuredOnly: true, limit: 12 }),
            view === "list"
                ? fetchPublicEvents(supabase, { period, type, category, barangay, search, page, limit: 20 })
                : Promise.resolve(null),
            view === "calendar"
                ? fetchPublicEvents(supabase, {
                    period,
                    type,
                    category,
                    barangay,
                    search,
                    month,
                    year,
                    limit: 200,
                })
                : Promise.resolve(null),
        ]);

        console.log(`[EventsPage] Data fetch completed in ${Date.now() - startTime}ms`, {
            categories: categoriesRes.data?.length || 0,
            barangays: barangaysRes.data?.length || 0,
            featured: featuredResult.data?.length || 0,
            list: listResult?.data?.length || 0,
            calendar: calendarResult?.data?.length || 0
        });

        const categories = categoriesRes.data || [];
        const barangays = barangaysRes.data || [];
        const featuredEvents = featuredResult.data;
        const calendarEvents = calendarResult?.data || [];
        const displayEvents = view === "list" ? (listResult?.data || []) : calendarEvents;

        const eventListSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: displayEvents.map((event, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph"}/olongapo/events/${event.slug}`,
                name: event.title,
            })),
        };

        const toggleParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (!value || key === "view") return;
            if (Array.isArray(value)) value.forEach((item) => toggleParams.append(key, item));
            else toggleParams.set(key, value);
        });

        return (
            <main className="min-h-screen bg-background">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventListSchema) }} />

                <div className="bg-gradient-to-b from-primary/5 to-transparent py-12">
                    <div className="container mx-auto px-4">
                        <Breadcrumbs items={[{ label: "Events" }]} className="mb-6" />
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
                                    Events in Olongapo City
                                </h1>
                                <p className="mt-4 text-lg text-muted-foreground">What&apos;s happening in Olongapo</p>
                            </div>

                            <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm">
                                <Link
                                    href={`/olongapo/events?${new URLSearchParams({ ...Object.fromEntries(toggleParams.entries()), view: "list" }).toString()}`}
                                    className={cn(
                                        "rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                                        view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    List View
                                </Link>
                                <Link
                                    href={`/olongapo/events?${new URLSearchParams({ ...Object.fromEntries(toggleParams.entries()), view: "calendar", month: `${month}`, year: `${year}` }).toString()}`}
                                    className={cn(
                                        "rounded-xl px-4 py-2 text-sm font-bold transition-colors",
                                        view === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    Calendar View
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto space-y-8 px-4 py-8">
                    <AdSlot location="category_banner" />

                    <FeaturedEvents events={featuredEvents} />

                    <EventFilterBar
                        categories={categories.map((category: any) => ({ id: category.id, name: category.name, slug: category.slug }))}
                        barangays={barangays.map((item: any) => ({ id: item.id, name: item.name, slug: item.slug }))}
                    />

                    {view === "list" ? (
                        <>
                            <EventsListView events={listResult?.data || []} />
                            <Pagination
                                currentPage={listResult?.page || 1}
                                totalPages={listResult?.totalPages || 1}
                                basePath={buildBasePath(params)}
                                className="pt-6"
                            />
                        </>
                    ) : (
                        <EventsCalendarView events={calendarEvents} month={month} year={year} />
                    )}
                </div>
            </main>
        );
    } catch (err) {
        console.error('[EventsPage] CRITICAL ERROR during data fetch:', err);
        throw err;
    }
}