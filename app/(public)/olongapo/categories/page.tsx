import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveCategories } from "@/lib/queries";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import AdSlot from "@/components/shared/AdSlot";
import CategoryCard from "@/components/public/CategoryCard";

export const metadata: Metadata = {
    title: "Browse Business Categories in Olongapo City | GalaPo",
    description:
        "Find businesses by category in Olongapo City. Browse restaurants, shops, services, health, education, and more.",
    openGraph: {
        title: "Browse Business Categories in Olongapo City | GalaPo",
        description:
            "Find businesses by category in Olongapo City. Browse restaurants, shops, services, health, education, and more.",
    },
};

export default async function CategoriesPage() {
    const supabase = await createServerSupabaseClient();

    // Fetch all categories
    const { data: allCategories } = await getActiveCategories(supabase);
    const categories = allCategories || [];

    // Separate parents and children
    const parents = categories.filter((c) => !c.parent_id);
    const children = categories.filter((c) => c.parent_id);

    // Fetch listing counts per category
    const { data: listings } = await supabase
        .from("listings")
        .select("category_id, subcategory_id")
        .eq("is_active", true)
        .eq("status", "approved");

    const listingData = listings || [];

    // Build enriched parent categories with counts and subcategory names
    const enrichedCategories = parents.map((parent) => {
        const subcats = children.filter((c) => c.parent_id === parent.id);
        const subcatIds = new Set(subcats.map((s) => s.id));

        // Count listings that belong to this parent or any of its subcategories
        const count = listingData.filter(
            (l) => l.category_id === parent.id || subcatIds.has(l.category_id) || subcatIds.has(l.subcategory_id)
        ).length;

        return {
            ...parent,
            listingCount: count,
            subcategories: subcats.map((s) => ({ name: s.name })),
        };
    });

    return (
        <main className="container mx-auto px-4 py-8">
            <Breadcrumbs
                items={[{ label: "Categories" }]}
                className="mb-6"
            />

            <AdSlot location="category_banner" className="mb-8" />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">
                    Browse All Categories in Olongapo
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Discover local businesses across {enrichedCategories.length} categories
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {enrichedCategories.map((cat) => (
                    <CategoryCard
                        key={cat.id}
                        name={cat.name}
                        slug={cat.slug}
                        icon={cat.icon}
                        listingCount={cat.listingCount}
                        subcategories={cat.subcategories}
                    />
                ))}
            </div>

            {enrichedCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-lg font-medium text-foreground">No categories found</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Categories will appear here once they are added.
                    </p>
                </div>
            )}
        </main>
    );
}
