import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import CityEventForm from "@/components/admin/events/CityEventForm";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminNewEventPage() {
    const admin = createAdminSupabaseClient();
    const { data: listings } = await admin
        .from("listings")
        .select("id, business_name, address, slug, is_featured, is_premium")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("business_name", { ascending: true });

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Create Event"
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Events Management", href: "/admin/events" },
                    { label: "Create Event" },
                ]}
            />

            <CityEventForm listings={listings || []} initialData={{ is_city_wide: true, is_featured: true }} />
        </div>
    );
}