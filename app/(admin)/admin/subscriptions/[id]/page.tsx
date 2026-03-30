"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import { SubscriptionDetail } from "@/components/admin/subscriptions/SubscriptionDetail";
import { SubscriptionTimeline } from "@/components/admin/subscriptions/SubscriptionTimeline";
import { ExtendDialog } from "@/components/admin/subscriptions/ExtendDialog";
import { UpgradeDialog } from "@/components/admin/subscriptions/UpgradeDialog";
import { getAdminPlanActionLabel } from "@/lib/subscription-helpers";

export default function AdminSubscriptionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    const [subscription, setSubscription] = useState<any>(null);
    const [listing, setListing] = useState<any>(null);
    const [owner, setOwner] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [extendOpen, setExtendOpen] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const planActionLabel = getAdminPlanActionLabel(subscription?.plan_type);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // We fetch the detailed data from our single endpoint + perhaps need a specific fetch
            // Let's call the specialized route we created earlier for GET one if we had it,
            // or we can fetch directly from Supabase client-side for simplicity in the admin panel if we configure a client.
            // Wait, we don't have a GET /id route yet. We used /api/admin/subscriptions for list.
            // Let's create a GET /api/admin/subscriptions/[id] route! Oh, I only created PATCH there.
            // I'll fetch via the list endpoint with a filter.
            const paramsURL = new URLSearchParams();
            paramsURL.set("id", id);
            
            // To simplify, let's just fetch it here or use a dedicated endpoint.
            const res = await fetch(`/api/admin/subscriptions/${id}/details`);
            if (!res.ok) throw new Error("Failed to fetch subscription details");
            const json = await res.json();
            
            setSubscription(json.subscription);
            setListing(json.listing);
            setOwner(json.owner);
            setPayments(json.payments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading subscription details...</div>;
    }

    if (!subscription) {
        return <div className="p-8 text-center text-red-500 font-bold">Subscription not found.</div>;
    }

    return (
        <div className="space-y-6 pb-24">
            <Link href="/admin/subscriptions" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground w-fit transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Subscriptions
            </Link>

            <AdminPageHeader
                title={`Subscription Details`}
                description={`Managing ${subscription.plan_type} subscription for ${listing?.business_name || "Unknown"}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setUpgradeOpen(true)}
                            className="flex h-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 px-4 text-xs font-bold transition-all hover:bg-blue-100"
                        >
                            {planActionLabel}
                        </button>
                        <button
                            onClick={() => setExtendOpen(true)}
                            className="flex h-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 text-xs font-bold transition-all hover:bg-emerald-100"
                        >
                            <CalendarPlus className="mr-2 h-4 w-4" /> Extend
                        </button>
                    </div>
                }
            />

            <SubscriptionDetail 
                subscription={subscription}
                listing={listing}
                owner={owner}
            />

            <div className="h-px bg-border/50 my-8" />

            <div className="max-w-3xl">
                <SubscriptionTimeline 
                    subscription={subscription}
                    payments={payments}
                />
            </div>

            {/* Dialogs */}
            <ExtendDialog 
                subscriptionId={id} 
                isOpen={extendOpen} 
                onClose={() => setExtendOpen(false)} 
                onSuccess={loadData} 
            />
            <UpgradeDialog 
                subscriptionId={id} 
                currentPlan={subscription.plan_type}
                isOpen={upgradeOpen} 
                onClose={() => setUpgradeOpen(false)} 
                onSuccess={loadData} 
            />
        </div>
    );
}
