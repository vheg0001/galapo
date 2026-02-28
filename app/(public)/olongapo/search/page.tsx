import { Suspense } from "react";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";
import { parseSearchParams } from "@/lib/search-helpers";
import { buildListingsQuery, resolveBarangaySlugs, getActiveCategories, searchListings, type SearchListingsParams } from "@/lib/queries";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import SearchPage from "@/components/public/search/SearchPage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface SearchPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
    const sp = await searchParams;
    const params = new URLSearchParams(
        Object.entries(sp)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""])
    );
    const q = params.get("q");
    const hasFilters = !!(params.get("barangay") || params.get("open_now") || params.get("page"));


    const title = q
        ? `Search "${q}" in Olongapo City | GalaPo`
        : "Search Businesses in Olongapo City | GalaPo";

    const description = q
        ? `Find ${q} businesses in Olongapo City. Browse verified listings with contact info, hours, and directions.`
        : "Search and discover local businesses in Olongapo City. Restaurants, clinics, services, hotels, and more — all in one place.";

    return {
        title,
        description,
        robots: {
            // Noindex filtered/paginated result pages to prevent thin content
            index: !hasFilters,
            follow: true,
        },
        openGraph: {
            title,
            description,
            type: "website",
        },
    };
}

export default async function SearchRoute({ searchParams }: SearchPageProps) {
    const sp = await searchParams;
    const params = new URLSearchParams(
        Object.entries(sp)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""])
    );

    const filters = parseSearchParams(params);
    const supabase = await createServerSupabaseClient();

    // Resolve barangay slugs to IDs
    const barangayIds = filters.barangay.length > 0
        ? await resolveBarangaySlugs(supabase, filters.barangay)
        : [];

    // Fetch listings (via RPC), categories, and barangays in parallel
    const [searchResult, categoriesResult, barangaysResult] = await Promise.all([
        searchListings(supabase, {
            search_query: filters.q || null,
            category_slug: filters.category || null,
            subcategory_slug: filters.subcategory || null,
            barangay_slugs: filters.barangay.length > 0 ? filters.barangay : null,
            city_slug: filters.city || 'olongapo',
            is_open_now: filters.openNow,
            featured_only: filters.featuredOnly,
            sort_by: filters.sort,
            page_number: filters.page,
            page_size: ITEMS_PER_PAGE
        }),
        getActiveCategories(supabase, true), // parent categories only
        supabase.from("barangays").select("id, name, slug").eq("is_active", true).order("name"),
    ]);

    const listings = searchResult.listings || [];
    const total = searchResult.total || 0;

    // Normalize listings to match the expected shape (if needed)
    // The RPC already returns primary_image, category_name, etc.
    const normalizedListings = listings.map((l: any) => ({
        ...l,
        image_url: l.primary_image || l.image_url || null,
        categories: { name: l.category_name },
        barangays: { name: l.barangay_name },
    }));

    const categories = categoriesResult.data?.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon ?? null,
    })) || [];

    const barangays = barangaysResult.data?.map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
    })) || [];

    const perPage = ITEMS_PER_PAGE;
    const totalPages = Math.ceil(total / perPage);
    const currentPage = filters.page;

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <SearchPage
                listings={normalizedListings}
                total={total}
                categories={categories}
                barangays={barangays}
                currentPage={currentPage}
                totalPages={totalPages}
                initialQ={filters.q || ""}
            />
        </Suspense>
    );
}
