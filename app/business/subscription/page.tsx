import { Suspense } from "react";
import type { Metadata } from "next";
import { CreditCard, Rocket, History } from "lucide-react";
import { getServerSession } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
    buildSubscriptionListItems,
    fetchCategoriesMap
} from "@/lib/subscription-route-helpers";
import CurrentPlanCard from "@/components/business/subscription/CurrentPlanCard";
import PaymentHistory from "@/components/business/subscription/PaymentHistory";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Subscription & Billing | Business Dashboard",
    description: "Manage your business listing plans and payments.",
};

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
    const session = await getServerSession();
    if (!session) return null;

    const admin = createAdminSupabaseClient();

    // Fetch all context for the user's listings and subscriptions
    const { data: listings } = await admin
        .from("listings")
        .select("id, business_name, status, is_featured, is_premium, category_id, subcategory_id")
        .eq("owner_id", session.user.id);

    const listingIds = (listings ?? []).map(l => l.id);

    const [
        { data: subscriptions },
        { data: placements },
        { data: payments },
        categoriesMap
    ] = await Promise.all([
        listingIds.length > 0
            ? admin.from("subscriptions").select("*").in("listing_id", listingIds)
            : Promise.resolve({ data: [] }),
        listingIds.length > 0
            ? admin.from("top_search_placements").select("*").in("listing_id", listingIds)
            : Promise.resolve({ data: [] }),
        admin.from("payments").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
        fetchCategoriesMap((listings ?? []).flatMap(l => [l.category_id, l.subcategory_id]))
    ]);

    const subscriptionItems = buildSubscriptionListItems({
        listings: listings ?? [],
        subscriptions: subscriptions ?? [],
        placements: placements ?? [],
        payments: payments ?? [],
        categories: categoriesMap
    });

    return (
        <div className="mx-auto w-full max-w-7xl space-y-10 pb-20">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Subscription & Billing</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Manage your listing plans and view your payment history.</p>
                </div>
            </header>

            {/* Current Plans Grid */}
            <section className="space-y-6">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-orange-100 p-2 text-orange-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">My Listings</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subscriptionItems.length > 0 ? (
                        subscriptionItems.map((item) => (
                            <CurrentPlanCard key={item.listing_id} item={item} />
                        ))
                    ) : (
                        <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
                            <p className="text-sm font-bold text-slate-900">No listings found</p>
                            <p className="mt-1 text-xs text-slate-500">Add a business listing to start managing subscriptions.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Top Search Placements */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">Top Search Placements</h2>
                    </div>
                    <Button size="sm" className="rounded-xl bg-slate-900 font-bold" asChild>
                        <Link href="/business/subscription/top-search">
                            Buy Placement
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {subscriptionItems.some(item => item.top_search_placements.length > 0) ? (
                        subscriptionItems.flatMap(item =>
                            item.top_search_placements.map(placement => (
                                <div key={placement.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black">
                                                #{placement.position}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{placement.category_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.listing_name}</p>
                                            </div>
                                        </div>
                                        {placement.status === "active" ? (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">Active</span>
                                        ) : placement.status === "pending_payment" ? (
                                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">Pending</span>
                                        ) : (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">Expired</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        <div className="col-span-full flex h-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active placements</p>
                            <p className="mt-1 text-[11px] font-medium text-slate-400">Boost your listing by appearing at the top of search results.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Payment History */}
            <section className="space-y-6">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                        <History className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Payment History</h2>
                </div>

                <Suspense fallback={
                    <div className="h-40 w-full animate-pulse rounded-3xl bg-slate-100" />
                }>
                    <PaymentHistory userId={session.user.id} />
                </Suspense>
            </section>
        </div>
    );
}
