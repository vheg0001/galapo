import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import { SubscriptionsManagementPanel } from "@/components/admin/subscriptions/SubscriptionsManagementPanel";

export const metadata = {
    title: "Subscriptions Management - GalaPo Admin",
};

export default function AdminSubscriptionsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Subscriptions Management"
                description="Manage listing subscriptions, plans, and renewals."
            />

            <SubscriptionsManagementPanel />
        </div>
    );
}
