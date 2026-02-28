import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
    getCategoryBySlug,
    getCategoryListings,
    getBarangaysGrouped,
    getSubcategoryCounts,
    getBarangayCounts,
    getListingBySlug,
    getRelatedListings,
    type CategorySort,
} from "@/lib/queries";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdSlot from "@/components/shared/AdSlot";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import Image from "next/image";
import CategoryDetailClient from "../[category]/CategoryDetailClient";

// Listing-specific imports
import ImageGallery from "@/components/public/listing/ImageGallery";
import BusinessInfo from "@/components/public/listing/BusinessInfo";
import ContactCard from "@/components/public/listing/ContactCard";
import LocationMap from "@/components/public/listing/LocationMap";
import RelatedListings from "@/components/public/listing/RelatedListings";
import ClaimBanner from "@/components/public/listing/ClaimBanner";
import MobileBottomBar from "@/components/public/listing/MobileBottomBar";
import ListingTabsClient from "@/app/(public)/listing/[slug]/ListingTabsClient";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ slugs: string[] }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slugs } = await params;
    const supabase = await createServerSupabaseClient();

    if (slugs.length === 1) {
        // Category page
        const category = await getCategoryBySlug(supabase, slugs[0]);
        if (!category) return { title: "Not Found | GalaPo" };
        return {
            title: `Best ${category.name} in Olongapo City | GalaPo`,
            description: `Find the best ${category.name.toLowerCase()} in Olongapo City.`,
        };
    }

    if (slugs.length === 2) {
        const [catSlug, seg2] = slugs;
        const category = await getCategoryBySlug(supabase, catSlug);
        if (!category) return { title: "Not Found | GalaPo" };

        // Check if seg2 is a subcategory
        const sub = category.subcategories.find((s: any) => s.slug === seg2);
        if (sub) {
            return {
                title: `Best ${sub.name} in Olongapo City | GalaPo`,
                description: `Find the best ${sub.name.toLowerCase()} in Olongapo City.`,
            };
        }

        // Otherwise might be a listing slug
        const listing = await getListingBySlug(supabase, seg2);
        if (listing) {
            const cat = listing.categories as any;
            const brgy = listing.barangays as any;
            return {
                title: `${listing.business_name} | ${cat?.name || "Business"} in ${brgy?.name || "Olongapo"} | GalaPo`,
                description: listing.short_description,
            };
        }

        return { title: "Not Found | GalaPo" };
    }

    if (slugs.length === 3) {
        // category / subcategory / listing
        const listing = await getListingBySlug(supabase, slugs[2]);
        if (listing) {
            const cat = listing.categories as any;
            const sub = listing.subcategories as any;
            const brgy = listing.barangays as any;
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph";
            const primaryImage = (listing.listing_images as any[])?.[0]?.image_url;
            return {
                title: `${listing.business_name} | ${sub?.name || cat?.name} in ${brgy?.name || "Olongapo"} | GalaPo`,
                description: listing.short_description,
                openGraph: {
                    images: primaryImage ? [{ url: primaryImage }] : [],
                },
                twitter: { card: "summary_large_image" },
            };
        }
        return { title: "Not Found | GalaPo" };
    }

    return { title: "Not Found | GalaPo" };
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default async function CatchAllOlongapoPage({ params, searchParams }: PageProps) {
    const { slugs } = await params;
    const sp = await searchParams;
    const supabase = await createServerSupabaseClient();

    // ── 1 SLUG → Category Page ──────────────────────────────────────────────
    if (slugs.length === 1) {
        return <CategoryPageView catSlug={slugs[0]} sp={sp} supabase={supabase} />;
    }

    // ── 2 SLUGS → Subcategory page OR Listing detail ────────────────────────
    if (slugs.length === 2) {
        const [catSlug, seg2] = slugs;
        const category = await getCategoryBySlug(supabase, catSlug);
        if (!category) notFound();

        const isSub = category.subcategories.find((s: any) => s.slug === seg2);
        if (isSub) {
            return <SubcategoryPageView catSlug={catSlug} subSlug={seg2} sp={sp} supabase={supabase} category={category} />;
        }

        // Try as listing slug
        const listing = await getListingBySlug(supabase, seg2);
        if (listing) {
            const related = await getRelatedListings(supabase, {
                categoryId: (listing.categories as any)?.id,
                subcategoryId: (listing.subcategories as any)?.id,
                excludeSlug: seg2,
            });
            return <ListingDetailView listing={listing} related={related} slug={seg2} />;
        }

        notFound();
    }

    // ── 3 SLUGS → category / subcategory / listing ──────────────────────────
    if (slugs.length === 3) {
        const listingSlug = slugs[2];
        const listing = await getListingBySlug(supabase, listingSlug);
        if (!listing) notFound();

        const related = await getRelatedListings(supabase, {
            categoryId: (listing.categories as any)?.id,
            subcategoryId: (listing.subcategories as any)?.id,
            excludeSlug: listingSlug,
        });
        return <ListingDetailView listing={listing} related={related} slug={listingSlug} />;
    }

    notFound();
}

// ── Category Page Sub-Component ───────────────────────────────────────────────

async function CategoryPageView({ catSlug, sp, supabase }: any) {
    const category = await getCategoryBySlug(supabase, catSlug);
    if (!category) notFound();

    const page = Number(sp.page) || 1;
    const sort = (sp.sort as CategorySort) || "featured";
    const featuredOnly = sp.featured === "true";
    const subSlug = typeof sp.sub === "string" ? sp.sub : undefined;
    const barangaySlugs = sp.barangay
        ? Array.isArray(sp.barangay) ? sp.barangay : [sp.barangay]
        : [];

    let subcategoryId: string | undefined;
    if (subSlug) {
        const sub = category.subcategories.find((s: any) => s.slug === subSlug);
        if (sub) subcategoryId = sub.id;
    }

    const [subCounts, listingsData, barangayGroups, brgyCounts] = await Promise.all([
        getSubcategoryCounts(supabase, category.id),
        getCategoryListings(supabase, { categoryId: category.id, subcategoryId, barangaySlugs: barangaySlugs.length > 0 ? barangaySlugs : undefined, featuredOnly, sort, page }),
        getBarangaysGrouped(supabase),
        getBarangayCounts(supabase, category.id, subcategoryId),
    ]);

    const { listings, total } = listingsData;
    const totalPages = Math.ceil(total / 20);
    const subcategoriesWithCounts = category.subcategories.map((sub: any) => ({ ...sub, listingCount: subCounts[sub.id] || 0 }));

    const buildBasePath = () => {
        const parts = [`/olongapo/${catSlug}`];
        const qp: string[] = [];
        if (subSlug) qp.push(`sub=${subSlug}`);
        if (sort !== "featured") qp.push(`sort=${sort}`);
        if (featuredOnly) qp.push("featured=true");
        barangaySlugs.forEach((b: string) => qp.push(`barangay=${b}`));
        if (qp.length > 0) parts.push(`?${qp.join("&")}`);
        return parts.join("");
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <Breadcrumbs items={[{ label: "Categories", href: "/olongapo/categories" }, { label: category.name }]} className="mb-6" />
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">{category.name} in Olongapo City</h1>
                <p className="mt-1 text-muted-foreground">{total} {total === 1 ? "business" : "businesses"} found</p>
            </div>
            <div className="flex gap-8">
                <div className="hidden w-64 shrink-0 lg:block">
                    <CategoryDetailClient variant="sidebar" categoryName={category.name} subcategories={subcategoriesWithCounts} barangayGroups={barangayGroups} barangayCounts={brgyCounts} />
                    <div className="mt-6"><AdSlot location="search_sidebar" /></div>
                </div>
                <div className="min-w-0 flex-1">
                    <CategoryDetailClient variant="main" categoryName={category.name} subcategories={subcategoriesWithCounts} barangayGroups={barangayGroups} barangayCounts={brgyCounts} listings={listings} currentPage={page} totalPages={totalPages} total={total} basePath={buildBasePath()} currentSort={sort} />
                </div>
            </div>
        </main>
    );
}

// ── Subcategory Page Sub-Component ───────────────────────────────────────────

async function SubcategoryPageView({ catSlug, subSlug, sp, supabase, category }: any) {
    const subcategory = category.subcategories.find((s: any) => s.slug === subSlug);
    if (!subcategory) notFound();

    const page = Number(sp.page) || 1;
    const sort = (sp.sort as CategorySort) || "featured";
    const featuredOnly = sp.featured === "true";
    const barangaySlugs = sp.barangay ? (Array.isArray(sp.barangay) ? sp.barangay : [sp.barangay]) : [];

    const [{ listings, total }, barangayGroups] = await Promise.all([
        getCategoryListings(supabase, { categoryId: category.id, subcategoryId: subcategory.id, barangaySlugs: barangaySlugs.length > 0 ? barangaySlugs : undefined, featuredOnly, sort, page }),
        getBarangaysGrouped(supabase),
    ]);

    const totalPages = Math.ceil(total / 20);
    const buildBasePath = () => {
        const parts = [`/olongapo/${catSlug}/${subSlug}`];
        const qp: string[] = [];
        if (sort !== "featured") qp.push(`sort=${sort}`);
        if (featuredOnly) qp.push("featured=true");
        barangaySlugs.forEach((b: string) => qp.push(`barangay=${b}`));
        if (qp.length > 0) parts.push(`?${qp.join("&")}`);
        return parts.join("");
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <Breadcrumbs items={[{ label: "Categories", href: "/olongapo/categories" }, { label: category.name, href: `/olongapo/${catSlug}` }, { label: subcategory.name }]} className="mb-6" />
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">{subcategory.name} in Olongapo City</h1>
                <p className="mt-1 text-muted-foreground">{total} {total === 1 ? "business" : "businesses"} found</p>
            </div>
            <div className="flex gap-8">
                <div className="hidden w-64 shrink-0 lg:block">
                    <CategoryDetailClient variant="sidebar" categoryName={category.name} subcategories={[]} barangayGroups={barangayGroups} showSubcategoryFilter={false} />
                    <div className="mt-6"><AdSlot location="search_sidebar" /></div>
                </div>
                <div className="min-w-0 flex-1">
                    <CategoryDetailClient variant="main" categoryName={category.name} subcategories={[]} barangayGroups={barangayGroups} showSubcategoryFilter={false} listings={listings} currentPage={page} totalPages={totalPages} total={total} basePath={buildBasePath()} currentSort={sort} />
                </div>
            </div>
        </main>
    );
}

// ── Listing Detail Sub-Component ─────────────────────────────────────────────

function ListingDetailView({ listing, related, slug }: any) {
    const cat = listing.categories as any;
    const sub = listing.subcategories as any;
    const brgy = listing.barangays as any;
    const images = listing.listing_images as any[];
    const deals = listing.deals as any[];
    const events = listing.events as any[];
    const fieldValues = listing.listing_field_values as any[];
    const hours = listing.operating_hours as any;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph";
    const pageUrl = `${appUrl}/olongapo/${cat?.slug}${sub ? `/${sub.slug}` : ""}/${slug}`;

    const hasDeals = deals?.length > 0;
    const hasEvents = events?.length > 0;
    const hasDynamicFields = fieldValues?.some((fv: any) => fv.value !== null && fv.value !== "");

    const breadcrumbItems = [
        ...(cat ? [{ label: cat.name, href: `/olongapo/${cat.slug}` }] : []),
        ...(sub ? [{ label: sub.name, href: `/olongapo/${cat?.slug}/${sub.slug}` }] : []),
        { label: listing.business_name },
    ];

    const tabs = [
        { id: "about", label: "About" },
        ...(hasDynamicFields ? [{ id: "details", label: "Details" }] : []),
        { id: "hours", label: "Hours" },
        ...(hasDeals ? [{ id: "deals", label: "Deals & Offers" }] : []),
        ...(hasEvents ? [{ id: "events", label: "Events" }] : []),
    ];

    return (
        <>
            <main className="min-h-screen pb-24 lg:pb-8">
                <div className="container mx-auto max-w-7xl px-4 py-6">
                    <Breadcrumbs items={breadcrumbItems} className="mb-6" />

                    <div className="relative mb-8">
                        <ImageGallery images={images} businessName={listing.business_name} categoryIcon={cat?.icon} />
                        {listing.logo_url && (
                            <div className="absolute -bottom-6 left-6 h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl">
                                <Image src={listing.logo_url} alt={`${listing.business_name} logo`} fill className="object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                        <div className="min-w-0 flex-1 space-y-8">
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
                            <ListingTabsClient
                                tabs={tabs}
                                description={listing.full_description}
                                tags={listing.tags || []}
                                paymentMethods={listing.payment_methods || []}
                                fieldValues={fieldValues}
                                categoryName={cat?.name}
                                hours={hours}
                                deals={deals}
                                events={events}
                            />
                        </div>

                        <aside className="w-full space-y-5 lg:w-80 xl:w-96 lg:sticky lg:top-24">
                            <ContactCard phone={listing.phone} phoneSecondary={listing.phone_secondary} email={listing.email} website={listing.website} socialLinks={listing.social_links} lat={listing.lat} lng={listing.lng} businessName={listing.business_name} listingSlug={slug} />
                            {listing.lat && listing.lng && (
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Location</h3>
                                    <LocationMap lat={Number(listing.lat)} lng={Number(listing.lng)} businessName={listing.business_name} address={listing.address} barangayName={brgy?.name} />
                                </div>
                            )}
                            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Share</h3>
                                <SocialShareButtons url={pageUrl} title={listing.business_name} />
                            </div>
                            <AdSlot location="listing_sidebar" />
                            {!listing.owner_id && <ClaimBanner slug={slug} businessName={listing.business_name} />}
                        </aside>
                    </div>

                    <div className="mt-12 space-y-10">
                        <AdSlot location="listing_banner" />
                        <RelatedListings listings={related} categoryName={sub?.name || cat?.name} />
                    </div>
                </div>
            </main>
            <MobileBottomBar phone={listing.phone} lat={listing.lat} lng={listing.lng} businessName={listing.business_name} url={pageUrl} listingSlug={slug} />
        </>
    );
}
