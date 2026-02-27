import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";
import { APP_NAME } from "@/lib/constants";
import SearchBar from "@/components/shared/SearchBar";
import ListingCard from "@/components/shared/ListingCard";
import EventCard from "@/components/shared/EventCard";
import DealCard from "@/components/shared/DealCard";
import BlogCard from "@/components/shared/BlogCard";
import AdSlot from "@/components/shared/AdSlot";
import MapView from "@/components/shared/MapView";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "GalaPo – Discover Olongapo City | Business Directory",
    description:
        "Find the best restaurants, shops, services, and more in Olongapo City. Your complete city directory and guide.",
    openGraph: {
        title: "GalaPo – Discover Olongapo City | Business Directory",
        description:
            "Find the best restaurants, shops, services, and more in Olongapo City. Your complete city directory and guide.",
        type: "website",
        locale: "en_PH",
        siteName: APP_NAME,
    },
    twitter: {
        card: "summary_large_image",
        title: "GalaPo – Discover Olongapo City",
        description: "Your complete city directory and guide for Olongapo City.",
    },
};

export default async function HomePage() {
    const supabase = await createServerSupabaseClient();

    // Parallelize all data fetching to reduce TTFB and LCP
    const [
        { data: categories },
        { data: barangays },
        { data: featuredListings },
        { data: latestListings },
        { data: events },
        { data: deals },
        { data: blogPosts },
        { data: mapListings },
        { data: categoryCounts },
    ] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, slug, icon, parent_id")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        supabase
            .from("barangays")
            .select("name")
            .eq("is_active", true)
            .order("name", { ascending: true }),
        supabase
            .from("listings")
            .select(`
                id, slug, business_name, short_description, phone, logo_url,
                is_featured, is_premium,
                categories!listings_category_id_fkey ( name ),
                barangays ( name )
            `)
            .eq("status", "approved")
            .eq("is_active", true)
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(8),
        supabase
            .from("listings")
            .select(`
                id, slug, business_name, short_description, phone, logo_url,
                is_featured, is_premium,
                categories!listings_category_id_fkey ( name ),
                barangays ( name )
            `)
            .eq("status", "approved")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(6),
        supabase
            .from("events")
            .select("id, slug, title, image_url, event_date, start_time, end_time, venue")
            .eq("is_active", true)
            .gte("event_date", new Date().toISOString().split("T")[0])
            .order("event_date", { ascending: true })
            .limit(4),
        supabase
            .from("deals")
            .select(`
                id, title, description, image_url, discount_text, end_date,
                listings ( slug, business_name )
            `)
            .eq("is_active", true)
            .gte("end_date", new Date().toISOString())
            .order("end_date", { ascending: true })
            .limit(6),
        supabase
            .from("blog_posts")
            .select("id, slug, title, excerpt, featured_image_url, published_at")
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(3),
        supabase
            .from("listings")
            .select("id, slug, business_name, lat, lng, categories!listings_category_id_fkey ( name )")
            .eq("status", "approved")
            .eq("is_active", true)
            .or("is_featured.eq.true,is_premium.eq.true")
            .not("lat", "is", null)
            .not("lng", "is", null)
            .limit(50),
        supabase
            .from("listings")
            .select("category_id")
            .eq("status", "approved")
            .eq("is_active", true),
    ]);

    const countMap: Record<string, number> = {};
    categoryCounts?.forEach((l) => {
        countMap[l.category_id] = (countMap[l.category_id] || 0) + 1;
    });

    // Aggregate sub-category counts into parents (supporting one level of nesting)
    if (categories) {
        const subCategories = categories.filter((c) => c.parent_id !== null);
        subCategories.forEach((sub) => {
            if (sub.parent_id) {
                countMap[sub.parent_id] = (countMap[sub.parent_id] || 0) + (countMap[sub.id] || 0);
            }
        });
    }

    const mapPins = (mapListings || [])
        .filter((l) => l.lat && l.lng)
        .map((l) => ({
            id: l.id,
            lat: Number(l.lat),
            lng: Number(l.lng),
            name: l.business_name,
            category: (l.categories as any)?.name,
            slug: l.slug,
        }));

    return (
        <>
            {/* ──── SECTION 1: Hero ──── */}
            <section className="relative overflow-hidden bg-primary px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#0f1d35]" />
                <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

                <div className="relative mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
                        Discover the Best of
                        <span className="block text-secondary">Olongapo City</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/80">
                        Find restaurants, services, shops, and more in your city
                    </p>
                    <div className="mt-10">
                        <SearchBar categories={categories || []} barangays={barangays || []} />
                    </div>
                </div>
            </section>

            {/* ──── SECTION 2: Ad Slot (Top) ──── */}
            <AdSlot location="homepage_banner" className="py-6 px-4" priority />

            {/* ──── SECTION 3: Featured Listings ──── */}
            {featuredListings && featuredListings.length > 0 && (
                <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Featured Businesses
                                </h2>
                                <p className="mt-1 text-muted-foreground">Top-rated businesses in Olongapo</p>
                            </div>
                            <Link href="/search?featured=true" className="hidden sm:flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
                                View All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                            {featuredListings.map((listing) => (
                                <div key={listing.id} className="w-72 shrink-0 snap-start">
                                    <ListingCard
                                        id={listing.id}
                                        slug={listing.slug}
                                        businessName={listing.business_name}
                                        shortDescription={listing.short_description}
                                        categoryName={(listing.categories as any)?.name}
                                        barangayName={(listing.barangays as any)?.name}
                                        phone={listing.phone}
                                        logoUrl={listing.logo_url}
                                        isFeatured={listing.is_featured}
                                        isPremium={listing.is_premium}
                                        priority
                                    />
                                </div>
                            ))}
                        </div>
                        <Link href="/search?featured=true" className="mt-4 flex sm:hidden items-center justify-center gap-1 text-sm font-medium text-secondary hover:underline">
                            View All Featured <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            )}

            {/* ──── SECTION 4: Browse by Category ──── */}
            <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Browse by Category
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Explore popular business categories in Olongapo City
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {(categories || [])
                            .filter((cat) => cat.parent_id === null)
                            .slice(0, 12)
                            .map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/categories/${cat.slug}`}
                                    className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-secondary hover:shadow-lg hover:-translate-y-1"
                                >
                                    <span className="text-3xl">{cat.icon || "📁"}</span>
                                    <span className="text-sm font-medium text-foreground group-hover:text-secondary transition-colors">
                                        {cat.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {countMap[cat.id] || 0} listings
                                    </span>
                                </Link>
                            ))}
                    </div>
                    <div className="mt-8 text-center">
                        <Link
                            href="/categories"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                            View All Categories <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ──── SECTION 5: Latest Listings ──── */}
            {latestListings && latestListings.length > 0 && (
                <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Newly Added Businesses
                                </h2>
                                <p className="mt-1 text-muted-foreground">Recently listed in the directory</p>
                            </div>
                            <Link href="/search" className="hidden sm:flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
                                View All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {latestListings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    id={listing.id}
                                    slug={listing.slug}
                                    businessName={listing.business_name}
                                    shortDescription={listing.short_description}
                                    categoryName={(listing.categories as any)?.name}
                                    barangayName={(listing.barangays as any)?.name}
                                    phone={listing.phone}
                                    logoUrl={listing.logo_url}
                                    isNew
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ──── SECTION 6: Ad Slot (Middle) ──── */}
            <AdSlot location="homepage_banner" position={2} className="py-6 px-4" />

            {/* ──── SECTION 7: Upcoming Events ──── */}
            {events && events.length > 0 && (
                <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    What&apos;s Happening in Olongapo
                                </h2>
                                <p className="mt-1 text-muted-foreground">Upcoming events and activities</p>
                            </div>
                            <Link href="/events" className="hidden sm:flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
                                View All Events <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    slug={event.slug}
                                    title={event.title}
                                    imageUrl={event.image_url}
                                    eventDate={event.event_date}
                                    startTime={event.start_time}
                                    endTime={event.end_time}
                                    venue={event.venue}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ──── SECTION 8: Hot Deals ──── */}
            {deals && deals.length > 0 && (
                <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Deals &amp; Offers
                                </h2>
                                <p className="mt-1 text-muted-foreground">Save big with these local deals</p>
                            </div>
                            <Link href="/deals" className="hidden sm:flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
                                View All Deals <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                            {deals.map((deal) => (
                                <DealCard
                                    key={deal.id}
                                    id={deal.id}
                                    listingSlug={(deal.listings as any)?.slug || ""}
                                    title={deal.title}
                                    businessName={(deal.listings as any)?.business_name || ""}
                                    discountText={deal.discount_text}
                                    imageUrl={deal.image_url}
                                    endDate={deal.end_date}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ──── SECTION 9: Blog Preview ──── */}
            {blogPosts && blogPosts.length > 0 && (
                <section className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    From Our Blog
                                </h2>
                                <p className="mt-1 text-muted-foreground">Stories and guides about Olongapo</p>
                            </div>
                            <Link href="/blog" className="hidden sm:flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
                                Visit Blog <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {blogPosts.map((post) => (
                                <BlogCard
                                    key={post.id}
                                    slug={post.slug}
                                    title={post.title}
                                    excerpt={post.excerpt}
                                    featuredImageUrl={post.featured_image_url}
                                    publishedAt={post.published_at}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ──── SECTION 10: CTA Banner ──── */}
            <section className="relative overflow-hidden bg-gradient-to-r from-secondary to-[#e85a25] px-4 py-16 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative mx-auto max-w-4xl text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        Own a Business in Olongapo?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
                        List your business for free and reach thousands of customers
                    </p>
                    <Link
                        href="/register"
                        className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-secondary transition-all hover:bg-white/90 hover:shadow-lg hover:scale-105"
                    >
                        Get Started — It&apos;s Free
                    </Link>
                </div>
            </section>

            {/* ──── SECTION 11: Map Overview ──── */}
            <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Explore Olongapo
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Browse featured businesses on the map
                        </p>
                    </div>
                    <MapView pins={mapPins} className="h-[450px] w-full" />
                </div>
            </section>
        </>
    );
}
