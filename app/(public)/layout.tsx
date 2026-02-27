import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createServerSupabaseClient();

    // Parallelize category and listing fetching for the Header mega menu
    const [
        { data: allCategories },
        { data: categoryCounts }
    ] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, slug, icon, parent_id")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
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

    if (allCategories) {
        const subCategories = allCategories.filter((c) => c.parent_id !== null);
        subCategories.forEach((sub) => {
            if (sub.parent_id) {
                countMap[sub.parent_id] = (countMap[sub.parent_id] || 0) + (countMap[sub.id] || 0);
            }
        });
    }

    const headerCategories = allCategories
        ?.filter((c) => c.parent_id === null)
        .map((cat) => ({
            ...cat,
            listing_count: countMap[cat.id] || 0,
        }));

    return (
        <div className="flex min-h-screen flex-col">
            <Header categories={headerCategories || []} />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
