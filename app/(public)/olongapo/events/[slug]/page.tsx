import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase";
import { fetchEventBySlug, fetchRelatedEvents } from "@/lib/event-helpers";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import EventDetail from "@/components/public/events/EventDetail";

interface EventDetailPageProps {
    params: Promise<{ slug: string }>;
}

function stripHtml(value: string) {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();
    const event = await fetchEventBySlug(supabase, slug);

    if (!event) {
        return { title: "Event Not Found | GalaPo" };
    }

    const formattedDate = format(new Date(`${event.event_date.split("T")[0]}T00:00:00`), "MMMM d, yyyy");

    return {
        title: `${event.title} — ${formattedDate} | GalaPo`,
        description: stripHtml(event.description).slice(0, 160),
    };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();
    const event = await fetchEventBySlug(supabase, slug);

    if (!event) {
        notFound();
    }

    const relatedEvents = await fetchRelatedEvents(supabase, event, 4);
    const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph"}/olongapo/events/${event.slug}`;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        startDate: `${event.event_date.split("T")[0]}T${event.start_time || "00:00:00"}`,
        endDate: `${event.event_date.split("T")[0]}T${event.end_time || event.start_time || "23:59:59"}`,
        location: {
            "@type": "Place",
            name: event.venue,
            address: event.venue_address,
        },
        description: stripHtml(event.description),
        image: event.image_url,
        organizer: event.listing?.business_name || "GalaPo",
        url: pageUrl,
    };

    const breadcrumbs = [
        { label: "Events", href: "/olongapo/events" },
        { label: event.title },
    ];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <main className="container mx-auto px-4 py-8">
                <Breadcrumbs items={breadcrumbs} className="mb-6" />
                <EventDetail event={event} relatedEvents={relatedEvents} />
            </main>
        </>
    );
}