import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getCategoryBySlug, getCategoryListings, getBarangaysGrouped, getSubcategoryCounts, getBarangayCounts, type CategorySort } from "@/lib/queries";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdSlot from "@/components/shared/AdSlot";
import CategoryDetailClient from "./CategoryDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ category: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: slug } = await params;
    const supabase = await createServerSupabaseClient();
    const category = await getCategoryBySlug(supabase, slug);

    if (!category) return { title: "Category Not Found | GalaPo" };

    return {
        title: `Best ${category.name} in Olongapo City | GalaPo`,
        description: `Find the best ${category.name.toLowerCase()} in Olongapo City. Browse verified businesses with addresses, phone numbers, and more.`,
        openGraph: {
            title: `Best ${category.name} in Olongapo City | GalaPo`,
            description: `Find the best ${category.name.toLowerCase()} in Olongapo City. Browse verified businesses with addresses, phone numbers, and more.`,
        },
    };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
    const { category: slug } = await params;
    const sp = await searchParams;
    const supabase = await createServerSupabaseClient();

    const category = await getCategoryBySlug(supabase, slug);
    if (!category) notFound();

    // Parse search params
    const page = Number(sp.page) || 1;
    const sort = (sp.sort as CategorySort) || "featured";
    const featuredOnly = sp.featured === "true";
    const subSlug = typeof sp.sub === "string" ? sp.sub : undefined;
    const barangaySlugs = sp.barangay
        ? Array.isArray(sp.barangay) ? sp.barangay : [sp.barangay]
        : [];

    // Resolve subcategory ID if sub filter is active
    let subcategoryId: string | undefined;
    if (subSlug) {
        const sub = category.subcategories.find((s: { slug: string }) => s.slug === subSlug);
        if (sub) subcategoryId = sub.id;
    }

    // Parallel fetch: Subcategory counts, Listings, Barangays, and Barangay-specific counts
    const [subCounts, listingsData, barangayGroups, brgyCounts] = await Promise.all([
        getSubcategoryCounts(supabase, category.id),
        getCategoryListings(supabase, {
            categoryId: category.id,
            subcategoryId,
            barangaySlugs: barangaySlugs.length > 0 ? barangaySlugs : undefined,
            featuredOnly,
            sort,
            page,
            searchQuery: typeof sp.q === "string" ? sp.q : undefined,
        }),
        getBarangaysGrouped(supabase),
        getBarangayCounts(supabase, category.id, subcategoryId),
    ]);

    const { listings, total } = listingsData;

    // Map counts to subcategories
    const subcategoriesWithCounts = category.subcategories.map(
        (sub: { id: string; name: string; slug: string }) => ({
            ...sub,
            listingCount: subCounts[sub.id] || 0,
        })
    );

    const totalPages = Math.ceil(total / 20);

    // Build basePath with current filters for pagination
    const buildBasePath = () => {
        const parts = [`/olongapo/${slug}`];
        const queryParts: string[] = [];
        if (subSlug) queryParts.push(`sub=${subSlug}`);
        if (sort !== "featured") queryParts.push(`sort=${sort}`);
        if (featuredOnly) queryParts.push("featured=true");
        barangaySlugs.forEach((b) => queryParts.push(`barangay=${b}`));
        if (queryParts.length > 0) parts.push(`?${queryParts.join("&")}`);
        return parts.join("");
    };

    // Schema.org structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${category.name} in Olongapo City`,
        numberOfItems: total,
        itemListElement: listings.map((l: { business_name: string; slug: string }, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            name: l.business_name,
            url: `https://galapo.com/listing/${l.slug}`,
        })),
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Breadcrumbs
                items={[
                    { label: "Categories", href: "/olongapo/categories" },
                    { label: category.name },
                ]}
                className="mb-6"
            />

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">
                    {category.name} in Olongapo City
                </h1>
                <p className="mt-1 text-muted-foreground">
                    {total} {total === 1 ? "business" : "businesses"} found
                </p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar — desktop */}
                <div className="hidden w-64 shrink-0 lg:block">
                    <CategoryDetailClient
                        variant="sidebar"
                        categoryName={category.name}
                        subcategories={subcategoriesWithCounts}
                        barangayGroups={barangayGroups}
                        barangayCounts={brgyCounts}
                    />
                    <div className="mt-6">
                        <AdSlot location="search_sidebar" />
                    </div>
                </div>

                {/* Main Content */}
                <div className="min-w-0 flex-1">
                    <CategoryDetailClient
                        variant="main"
                        categoryName={category.name}
                        subcategories={subcategoriesWithCounts}
                        barangayGroups={barangayGroups}
                        barangayCounts={brgyCounts}
                        listings={listings}
                        currentPage={page}
                        totalPages={totalPages}
                        total={total}
                        basePath={buildBasePath()}
                        currentSort={sort}
                    />
                </div>
            </div>
        </main>
    );
}
