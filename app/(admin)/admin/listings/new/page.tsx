import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import AdminListingForm from "@/components/admin/listings/AdminListingForm";

export default function AdminCreateListingPage() {
    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Create Listing"
                description="Admin-created listings default to approved. If no owner is assigned, it will be pre-populated."
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Listings", href: "/admin/listings" },
                    { label: "New" },
                ]}
            />
            <AdminListingForm mode="create" />
        </div>
    );
}
