import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getListingBySlug, getRelatedListings } from "@/lib/queries";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdSlot from "@/components/shared/AdSlot";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import ImageGallery from "@/components/public/listing/ImageGallery";
import BusinessInfo from "@/components/public/listing/BusinessInfo";
import ContactCard from "@/components/public/listing/ContactCard";
import OperatingHours from "@/components/public/listing/OperatingHours";
import DynamicFields from "@/components/public/listing/DynamicFields";
import DealsList from "@/components/public/listing/DealsList";
import EventsList from "@/components/public/listing/EventsList";
import LocationMap from "@/components/public/listing/LocationMap";
import RelatedListings from "@/components/public/listing/RelatedListings";
import ClaimBanner from "@/components/public/listing/ClaimBanner";
import MobileBottomBar from "@/components/public/listing/MobileBottomBar";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();
    const listing = await getListingBySlug(supabase, slug);

    if (!listing) return { title: "Listing Not Found | GalaPo" };

    const cat = listing.categories as any;
    const sub = listing.subcategories as any;
    const brgy = listing.barangays as any;
    const primaryImage = (listing.listing_images as any[])?.[0]?.image_url;

    const titleParts = [
        listing.business_name,
        sub?.name || cat?.name,
        brgy ? `in ${brgy.name}` : "in Olongapo",
        "GalaPo",
    ].filter(Boolean);

    return {
        title: titleParts.join(" | "),
        description: listing.short_description,
        openGraph: {
            title: listing.business_name,
            description: listing.short_description,
            type: "website",
            images: primaryImage ? [{ url: primaryImage, width: 1200, height: 630 }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: listing.business_name,
            description: listing.short_description,
            images: primaryImage ? [primaryImage] : [],
        },
    };
}

export default async function ListingDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    const listing = await getListingBySlug(supabase, slug);
    if (!listing) notFound();

    const cat = listing.categories as any;
    const sub = listing.subcategories as any;
    const brgy = listing.barangays as any;
    const images = listing.listing_images as any[];
    const deals = listing.deals as any[];
    const events = listing.events as any[];
    const fieldValues = listing.listing_field_values as any[];

    // Fetch related listings
    const related = await getRelatedListings(supabase, {
        categoryId: cat?.id,
        subcategoryId: sub?.id,
        excludeSlug: slug,
        limit: 4,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph";
    const pageUrl = `${appUrl}/listing/${slug}`;
    const primaryImage = images[0]?.image_url;

    // Tabs visibility
    const hasDeals = deals && deals.length > 0;
    const hasEvents = events && events.length > 0;
    const hasDynamicFields = fieldValues && fieldValues.length > 0;

    // JSON-LD: LocalBusiness
    const hours = listing.operating_hours as any;
    const openingHoursSpec = hours
        ? Object.entries(hours)
            .filter(([, v]: any) => !v.closed)
            .map(([day, v]: any) => ({
                "@type": "OpeningHoursSpecification",
                dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
                opens: v.open,
                closes: v.close,
            }))
        : [];

    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: listing.business_name,
        description: listing.short_description,
        image: primaryImage,
        address: {
            "@type": "PostalAddress",
            streetAddress: listing.address,
            addressLocality: "Olongapo City",
            addressRegion: "Zambales",
            addressCountry: "PH",
        },
        ...(listing.lat && listing.lng && {
            geo: {
                "@type": "GeoCoordinates",
                latitude: listing.lat,
                longitude: listing.lng,
            },
        }),
        telephone: listing.phone,
        url: listing.website || pageUrl,
        ...(openingHoursSpec.length > 0 && { openingHoursSpecification: openingHoursSpec }),
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
            ...(cat ? [{ "@type": "ListItem", position: 2, name: cat.name, item: `${appUrl}/olongapo/${cat.slug}` }] : []),
            ...(sub ? [{ "@type": "ListItem", position: 3, name: sub.name, item: `${appUrl}/olongapo/${cat?.slug}/${sub.slug}` }] : []),
            { "@type": "ListItem", position: cat && sub ? 4 : cat ? 3 : 2, name: listing.business_name, item: pageUrl },
        ],
    };

    // Build breadcrumb items for the UI
    const breadcrumbItems = [
        ...(cat ? [{ label: cat.name, href: `/olongapo/${cat.slug}` }] : []),
        ...(sub ? [{ label: sub.name, href: `/olongapo/${cat?.slug}/${sub.slug}` }] : []),
        { label: listing.business_name },
    ];

    return (
        <>
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            <main className="min-h-screen pb-24 lg:pb-8">
                <div className="container mx-auto max-w-7xl px-4 py-6">
                    {/* Breadcrumbs */}
                    <Breadcrumbs items={breadcrumbItems} className="mb-6" />

                    {/* ── Hero Image Gallery ── */}
                    <div className="relative mb-8">
                        <ImageGallery
                            images={images}
                            businessName={listing.business_name}
                            categoryIcon={cat?.icon}
                        />

                        {/* Business logo — overlapping bottom-left of hero */}
                        {listing.logo_url && (
                            <div className="absolute -bottom-6 left-6 h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl">
                                <Image
                                    src={listing.logo_url}
                                    alt={`${listing.business_name} logo`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Main Content Layout ── */}
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                        {/* ══════════════════════════════════════════════════════
                            LEFT COLUMN (65% on desktop)
                        ═══════════════════════════════════════════════════════ */}
                        <div className="min-w-0 flex-1 space-y-8">
                            {/* Business Info */}
                            <div className={listing.logo_url ? "pt-8" : ""}>
                                <BusinessInfo
                                    businessName={listing.business_name}
                                    address={listing.address}
                                    category={cat}
                                    subcategory={sub}
                                    operatingHours={hours}
                                    isFeatured={listing.is_featured}
                                    isPremium={listing.is_premium}
                                />
                            </div>

                            {/* ── TABS ── */}
                            <ListingTabs
                                description={listing.full_description}
                                tags={listing.tags as string[]}
                                paymentMethods={listing.payment_methods as string[]}
                                fieldValues={fieldValues}
                                categoryName={cat?.name}
                                hours={hours}
                                deals={deals}
                                events={events}
                                hasDynamicFields={hasDynamicFields}
                                hasDeals={hasDeals}
                                hasEvents={hasEvents}
                            />
                        </div>

                        {/* ══════════════════════════════════════════════════════
                            RIGHT COLUMN (35% on desktop, stacks on mobile)
                        ═══════════════════════════════════════════════════════ */}
                        <aside className="w-full space-y-5 lg:w-80 xl:w-96 lg:sticky lg:top-24">
                            {/* Contact Card */}
                            <ContactCard
                                phone={listing.phone}
                                phoneSecondary={listing.phone_secondary}
                                email={listing.email}
                                website={listing.website}
                                socialLinks={listing.social_links as any}
                                lat={listing.lat}
                                lng={listing.lng}
                                businessName={listing.business_name}
                                listingSlug={slug}
                            />

                            {/* Location Map */}
                            {listing.lat && listing.lng && (
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Location
                                    </h3>
                                    <LocationMap
                                        lat={Number(listing.lat)}
                                        lng={Number(listing.lng)}
                                        businessName={listing.business_name}
                                        address={listing.address}
                                        barangayName={brgy?.name}
                                    />
                                </div>
                            )}

                            {/* Share */}
                            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Share
                                </h3>
                                <SocialShareButtons url={pageUrl} title={listing.business_name} />
                            </div>

                            {/* Ad slot */}
                            <AdSlot location="listing_sidebar" />

                            {/* Claim banner — only if no owner */}
                            {!listing.owner_id && (
                                <ClaimBanner slug={slug} businessName={listing.business_name} />
                            )}
                        </aside>
                    </div>

                    {/* ── BOTTOM FULL-WIDTH SECTION ── */}
                    <div className="mt-12 space-y-10">
                        {/* Ad slot banner */}
                        <AdSlot location="listing_banner" />

                        {/* Related listings */}
                        <RelatedListings
                            listings={related as any}
                            categoryName={sub?.name || cat?.name}
                        />
                    </div>
                </div>
            </main>

            {/* Mobile sticky bar */}
            <MobileBottomBar
                phone={listing.phone}
                lat={listing.lat}
                lng={listing.lng}
                businessName={listing.business_name}
                url={pageUrl}
                listingSlug={slug}
            />
        </>
    );
}

// ──────────────────────────────────────────────────────────
// Listing Tabs (Client Component)
// ──────────────────────────────────────────────────────────
// Extracted as a server-compatible wrapper; the actual tab state
// is handled via URL-friendly tab IDs using native CSS trick.

interface ListingTabsProps {
    description: string | null;
    tags: string[];
    paymentMethods: string[];
    fieldValues: any[];
    categoryName?: string;
    hours: any;
    deals: any[];
    events: any[];
    hasDynamicFields: boolean;
    hasDeals: boolean;
    hasEvents: boolean;
}

const PAYMENT_METHOD_ICONS: Record<string, string> = {
    cash: "💵",
    gcash: "📱",
    "credit card": "💳",
    "debit card": "💳",
    maya: "📱",
    bank: "🏦",
    paypal: "🌐",
    check: "📄",
};

function ListingTabs({
    description,
    tags,
    paymentMethods,
    fieldValues,
    categoryName,
    hours,
    deals,
    events,
    hasDynamicFields,
    hasDeals,
    hasEvents,
}: ListingTabsProps) {
    const tabs = [
        { id: "about", label: "About", always: true },
        { id: "details", label: "Details", always: false, show: hasDynamicFields },
        { id: "hours", label: "Hours", always: true },
        { id: "deals", label: "Deals & Offers", always: false, show: hasDeals },
        { id: "events", label: "Events", always: false, show: hasEvents },
    ].filter((t) => t.always || t.show);

    return (
        <ListingTabsClient
            tabs={tabs}
            description={description}
            tags={tags}
            paymentMethods={paymentMethods}
            fieldValues={fieldValues}
            categoryName={categoryName}
            hours={hours}
            deals={deals}
            events={events}
        />
    );
}

// We need client-side interactivity for tabs, so this is split out
// The actual client component is inlined here to keep the file count manageable
import ListingTabsClient from "./ListingTabsClient";
