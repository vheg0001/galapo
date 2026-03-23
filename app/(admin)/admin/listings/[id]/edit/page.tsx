import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import AdminListingForm from "@/components/admin/listings/AdminListingForm";

export default async function AdminEditListingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Edit Listing"
                description="Admin edits are applied directly and do not require re-approval."
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Listings", href: "/admin/listings" },
                    { label: "Edit" },
                ]}
            />
            <AdminListingForm mode="edit" listingId={id} />
        </div>
    );
}
