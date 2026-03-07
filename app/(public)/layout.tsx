import { headers } from "next/headers";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createServerSupabaseClient();
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";

    const isAdminLoginPath = pathname === "/admin/login";

    // Parallelize category, listing, and user role fetching
    const [
        { data: allCategories },
        { data: categoryCounts },
        { data: settingsData },
        { data: { user } }
    ] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, slug, icon, parent_id")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        supabase
            .from("listings")
            .select("category_id")
            .in("status", ["approved", "claimed_pending"])
            .eq("is_active", true),
        supabase
            .from("site_settings")
            .select("key, value")
            .in("key", ["site_name", "site_tagline", "site_description", "facebook_url", "instagram_url", "tiktok_url", "twitter_url", "youtube_url", "maintenance_mode"]),
        supabase.auth.getUser()
    ]);

    const settings: Record<string, any> = {};
    settingsData?.forEach(s => {
        settings[s.key] = s.value;
    });

    const isMaintenanceMode = settings.maintenance_mode === true || settings.maintenance_mode === "true";
    let isAdmin = false;
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        isAdmin = profile?.role === "super_admin";
    }

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
            {isMaintenanceMode && isAdmin && (
                <div className="bg-amber-500 py-1.5 px-4 text-center text-[11px] font-bold uppercase tracking-widest text-black flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
                    Maintenance Mode is ON — Public visitors are redirected
                    <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
                </div>
            )}
            <Header categories={headerCategories || []} settings={settings} />
            <main className="flex-1">{children}</main>
            <Footer settings={settings} />
        </div>
    );
}
