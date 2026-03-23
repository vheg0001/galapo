import { notFound } from "next/navigation";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import CityEventForm from "@/components/admin/events/CityEventForm";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface AdminEditEventPageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
    const { id } = await params;
    const admin = createAdminSupabaseClient();

    const [{ data: event }, { data: listings }] = await Promise.all([
        admin.from("events").select("*").eq("id", id).maybeSingle(),
        admin
            .from("listings")
            .select("id, business_name, address, slug, is_featured, is_premium")
            .eq("status", "approved")
            .eq("is_active", true)
            .order("business_name", { ascending: true }),
    ]);

    if (!event) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Edit Event"
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Events Management", href: "/admin/events" },
                    { label: "Edit Event" },
                ]}
            />

            <CityEventForm listings={listings || []} initialData={event} isEditing />
        </div>
    );
}