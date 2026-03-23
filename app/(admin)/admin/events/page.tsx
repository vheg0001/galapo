import Link from "next/link";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import AdminEventsTable from "@/components/admin/events/AdminEventsTable";

export default function AdminEventsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Events Management"
                breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Events Management" }]}
                actions={
                    <Link href="/admin/events/new" className="inline-flex items-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90">
                        Create City Event
                    </Link>
                }
            />

            <AdminEventsTable />
        </div>
    );
}