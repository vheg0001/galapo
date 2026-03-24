import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import { SubscriptionStatsRow } from "@/components/admin/subscriptions/SubscriptionStatsRow";
import { SubscriptionsTable } from "@/components/admin/subscriptions/SubscriptionsTable";
import { createServerSupabaseClient } from "@/lib/supabase";

export const metadata = {
    title: "Subscriptions Management - GalaPo Admin",
};

export default async function AdminSubscriptionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const supabase = await createServerSupabaseClient();
    
    // We will await searchParams to use them for filtering the table if needed
    const params = await searchParams;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Subscriptions Management"
                description="Manage listing subscriptions, plans, and renewals."
            />

            <SubscriptionStatsRow />

            <div className="mt-8">
                <SubscriptionsTable />
            </div>
        </div>
    );
}
