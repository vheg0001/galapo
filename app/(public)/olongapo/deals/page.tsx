import { Suspense } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveCategories, resolveCategorySlug, resolveBarangaySlugs } from "@/lib/queries";
import DealsGrid from "@/components/public/deals/DealsGrid";
import FeaturedDeals from "@/components/public/deals/FeaturedDeals";
import DealFilterBar from "@/components/public/deals/DealFilterBar";
import AdSlot from "@/components/shared/AdSlot";
import { Metadata } from "next";
import { addMonths } from "date-fns";

export const metadata: Metadata = {
    title: "Deals & Offers in Olongapo City",
    description: "Discover the best discounts, vouchers, and special offers from local businesses in Olongapo.",
};

interface DealsPageProps {
    searchParams: {
        category?: string;
        barangay?: string;
        sort?: string;
        page?: string;
    };
}

export default async function DealsPage(props: DealsPageProps) {
    const searchParams = await props.searchParams;
    const supabase = await createServerSupabaseClient();

    // Resolve filter IDs if slugs are provided
    const [resolvedCategory, resolvedBarangays] = await Promise.all([
        searchParams.category ? resolveCategorySlug(supabase, searchParams.category) : Promise.resolve(null),
        searchParams.barangay ? resolveBarangaySlugs(supabase, [searchParams.barangay]) : Promise.resolve([])
    ]);

    // Fetch Categories & Barangays for filters
    const [categoriesRes, barangaysRes] = await Promise.all([
        getActiveCategories(supabase, true),
        supabase.from("barangays").select("id, name, slug").order("name")
    ]);

    const categories = categoriesRes.data || [];
    const barangays = barangaysRes.data || [];

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

    // Base query for deals
    // Only use !inner if we are actually filtering by listing properties to avoid 
    // hiding deals without perfect metadata in the default view.
    const isFiltered = !!(resolvedCategory || resolvedBarangays.length > 0);
    const listingJoin = isFiltered ? "!inner" : "";

    let query = supabase
        .from("deals")
        .select(`
            *,
            listing:listings${listingJoin} (
                id,
                business_name,
                slug,
                is_featured,
                is_premium,
                category_id,
                barangay_id,
                category:categories!listings_category_id_fkey (id, name, slug),
                barangay:barangays (id, name, slug),
                listing_badges (
                    id,
                    badge:badges (*)
                )
            )
        `, { count: "exact" })
        .eq("is_active", true)
        .gte("end_date", today)
        .lte("start_date", addMonths(new Date(), 1).toISOString());


    // Apply filters from searchParams using resolved IDs
    if (resolvedCategory) {
        if (!resolvedCategory.parent_id) {
            // If it's a parent category, include all its subcategories
            const { data: subs } = await supabase
                .from("categories")
                .select("id")
                .eq("parent_id", resolvedCategory.id);
            
            const categoryIds = [resolvedCategory.id, ...(subs?.map(s => s.id) || [])];
            query = query.in("listing.category_id", categoryIds);
        } else {
            query = query.eq("listing.category_id", resolvedCategory.id);
        }
    }
    if (resolvedBarangays.length > 0) {
        query = query.in("listing.barangay_id", resolvedBarangays);
    }

    // Apply Sorting
    const sort = searchParams.sort || "expiring_soon";
    if (sort === "expiring_soon") {
        query = query.order("end_date", { ascending: true });
    } else if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
    }

    const { data: allDeals, count, error: dealsError } = await query;

    if (dealsError) {
        console.error("[Public Deals Page] Failed to fetch deals", dealsError);
    }

    // Safety check: Filter out deals that might be orphaned (missing listing)
    const validDeals = (allDeals || []).filter((d: any) => d.listing);

    // Filter featured/premium deals for the top section
    const featuredDeals = validDeals.filter((d: any) => d.listing.is_featured || d.listing.is_premium);

    // Pagination logic
    const limit = 20;
    const page = parseInt(searchParams.page || "1");
    const offset = (page - 1) * limit;
    const paginatedDeals = validDeals.slice(offset, offset + limit);

    return (
        <main className="min-h-screen bg-background">
            {/* Header Area */}
            <div className="bg-gradient-to-b from-primary/5 to-transparent pt-12 pb-16">
                <div className="container mx-auto px-4">
                    <nav className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-foreground">Deals</span>
                    </nav>

                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
                            Deals & Offers in <span className="text-primary">Olongapo City</span>
                        </h1>
                        <p className="mt-6 text-lg font-medium text-muted-foreground md:text-xl">
                            {count || 0} active deals and offers from local businesses. Save big while supporting local!
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {/* Ad Slot */}
                <div className="mb-12">
                    <AdSlot location="category_banner" />
                </div>

                {/* Filter Bar */}
                <div className="sticky top-16 z-30 mb-8 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/40 md:static md:top-auto md:mb-12 md:bg-transparent md:backdrop-blur-none md:border-none md:px-0 md:py-0">
                    <DealFilterBar
                        categories={categories as any}
                        barangays={barangays as any}
                    />
                </div>

                {/* Featured Area */}
                {!searchParams.category && !searchParams.barangay && (
                    <FeaturedDeals deals={featuredDeals as any} />
                )}

                {/* Main Grid */}
                <section className="py-12">
                    <div className="mb-8 flex items-end justify-between">
                        <h2 className="text-2xl font-black tracking-tight text-foreground">
                            {searchParams.category || searchParams.barangay ? "Filtered Results" : "All Active Deals"}
                        </h2>
                    </div>

                    <Suspense fallback={<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[16/9] rounded-[2rem] bg-muted/50" />
                        ))}
                    </div>}>
                        <DealsGrid deals={paginatedDeals as any} />
                    </Suspense>

                    {/* Pagination - Simple link-based */}
                    {!!count && count > limit && (
                        <div className="mt-16 flex justify-center gap-4">
                            {page > 1 && (
                                <Link
                                    href={`?page=${page - 1}${searchParams.category ? `&category=${searchParams.category}` : ""}${searchParams.barangay ? `&barangay=${searchParams.barangay}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
                                    className="rounded-2xl border border-border px-6 py-3 text-sm font-bold transition-all hover:bg-muted"
                                >
                                    Previous
                                </Link>
                            )}
                            {count > offset + limit && (
                                <Link
                                    href={`?page=${page + 1}${searchParams.category ? `&category=${searchParams.category}` : ""}${searchParams.barangay ? `&barangay=${searchParams.barangay}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
                                    className="rounded-2xl border border-border px-6 py-3 text-sm font-bold transition-all hover:bg-muted"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
