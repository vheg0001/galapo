import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getCategoryBySlug, getCategoryListings, getBarangaysGrouped, type CategorySort } from "@/lib/queries";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import CategoryDetailClient from "../CategoryDetailClient";
import AdSlot from "@/components/shared/AdSlot";

interface PageProps {
    params: Promise<{ category: string; subcategory: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category: catSlug, subcategory: subSlug } = await params;
    const supabase = await createServerSupabaseClient();
    const category = await getCategoryBySlug(supabase, catSlug);

    if (!category) return { title: "Not Found | GalaPo" };

    const sub = category.subcategories.find((s: { slug: string }) => s.slug === subSlug);
    const name = sub?.name || subSlug;

    return {
        title: `Best ${name} in Olongapo City | GalaPo`,
        description: `Find the best ${name.toLowerCase()} in Olongapo City. Browse verified businesses with addresses, phone numbers, and more.`,
    };
}

export default async function SubcategoryPage({ params, searchParams }: PageProps) {
    const { category: catSlug, subcategory: subSlug } = await params;
    const sp = await searchParams;
    const supabase = await createServerSupabaseClient();

    const category = await getCategoryBySlug(supabase, catSlug);
    if (!category) notFound();

    const subcategory = category.subcategories.find((s: { slug: string }) => s.slug === subSlug);
    if (!subcategory) notFound();

    // Parse search params
    const page = Number(sp.page) || 1;
    const sort = (sp.sort as CategorySort) || "featured";
    const featuredOnly = sp.featured === "true";
    const barangaySlugs = sp.barangay
        ? Array.isArray(sp.barangay) ? sp.barangay : [sp.barangay]
        : [];

    // Fetch listings for this subcategory
    const { listings, total } = await getCategoryListings(supabase, {
        categoryId: category.id,
        subcategoryId: subcategory.id,
        barangaySlugs: barangaySlugs.length > 0 ? barangaySlugs : undefined,
        featuredOnly,
        sort,
        page,
    });

    // Fetch barangays
    const barangayGroups = await getBarangaysGrouped(supabase);

    const totalPages = Math.ceil(total / 20);

    // Build basePath
    const buildBasePath = () => {
        const parts = [`/olongapo/${catSlug}/${subSlug}`];
        const queryParts: string[] = [];
        if (sort !== "featured") queryParts.push(`sort=${sort}`);
        if (featuredOnly) queryParts.push("featured=true");
        barangaySlugs.forEach((b) => queryParts.push(`barangay=${b}`));
        if (queryParts.length > 0) parts.push(`?${queryParts.join("&")}`);
        return parts.join("");
    };

    // Schema.org
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${subcategory.name} in Olongapo City`,
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
                    { label: category.name, href: `/olongapo/${catSlug}` },
                    { label: subcategory.name },
                ]}
                className="mb-6"
            />

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">
                    {subcategory.name} in Olongapo City
                </h1>
                <p className="mt-1 text-muted-foreground">
                    {total} {total === 1 ? "business" : "businesses"} found
                </p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar */}
                <div className="hidden w-64 shrink-0 lg:block">
                    <CategoryDetailClient
                        variant="sidebar"
                        categoryName={category.name}
                        subcategories={[]}
                        barangayGroups={barangayGroups}
                        showSubcategoryFilter={false}
                    />
                    <div className="mt-6">
                        <AdSlot location="search_sidebar" />
                    </div>
                </div>

                {/* Main */}
                <div className="min-w-0 flex-1">
                    <CategoryDetailClient
                        variant="main"
                        categoryName={category.name}
                        subcategories={[]}
                        barangayGroups={barangayGroups}
                        showSubcategoryFilter={false}
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
