import type { Metadata } from "next";
import { Suspense } from "react";
import { createAdminSupabaseClient } from "@/lib/supabase";
import AdminStatsCard from "@/components/admin/dashboard/AdminStatsCard";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import AdminDashboardDeepSections from "@/components/admin/dashboard/AdminDashboardDeepSections";
import { Building2, CreditCard, ShieldCheck, Users, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Dashboard - GalaPo Admin",
    robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function AdminDashboardPage() {
    const admin = createAdminSupabaseClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
        { count: totalListings },
        { count: pendingListings },
        { count: pendingPayments },
        { count: pendingClaims },
        { count: activeSubscriptions },
        { count: viewsThisMonthCount },
    ] = await Promise.all([
        admin.from("listings").select("id", { count: "exact", head: true }).eq("is_active", true),
        admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "claimed_pending"),
        admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        admin.from("listing_analytics").select("id", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", startOfMonth),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening on GalaPo.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AdminStatsCard
                    label="Active Listings"
                    value={totalListings ?? 0}
                    icon={Building2}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    href="/admin/listings"
                />
                <AdminStatsCard
                    label="Pending Approvals"
                    value={pendingListings ?? 0}
                    icon={Building2}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                    href="/admin/listings?status=pending"
                    urgent
                />
                <AdminStatsCard
                    label="Pending Payments"
                    value={pendingPayments ?? 0}
                    icon={CreditCard}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-100"
                    href="/admin/payments?status=pending"
                    urgent
                />
                <AdminStatsCard
                    label="Pending Claims"
                    value={pendingClaims ?? 0}
                    icon={ShieldCheck}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    href="/admin/claims"
                    urgent
                />
                <AdminStatsCard
                    label="Active Subscriptions"
                    value={activeSubscriptions ?? 0}
                    icon={Users}
                    iconColor="text-sky-600"
                    iconBg="bg-sky-100"
                    href="/admin/subscriptions"
                />
                <AdminStatsCard
                    label="Page Views (This Month)"
                    value={(viewsThisMonthCount ?? 0).toLocaleString()}
                    icon={BarChart2}
                    iconColor="text-[#FF6B35]"
                    iconBg="bg-[#FF6B35]/10"
                    href="/admin/analytics"
                />
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Actions</h3>
                <QuickActions
                    pendingListings={pendingListings ?? 0}
                    pendingPayments={pendingPayments ?? 0}
                    pendingClaims={pendingClaims ?? 0}
                />
            </div>

            <Suspense
                fallback={
                    <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
                        Loading dashboard insights...
                    </div>
                }
            >
                <AdminDashboardDeepSections />
            </Suspense>
        </div>
    );
}
