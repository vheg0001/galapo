import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createServerSupabaseClient();

    // Fetch parent categories for the Header mega menu
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    return (
        <div className="flex min-h-screen flex-col">
            <Header categories={categories || []} />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
