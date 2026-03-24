import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
    ensureOwnedListing,
    fetchCategoriesMap,
    buildSubscriptionListItems,
    mapPaymentInstructionsFromAmount
} from "@/lib/subscription-route-helpers";
import { getPricingSettings } from "@/lib/subscription-helpers";
import UpgradeWizard from "@/components/business/subscription/UpgradeWizard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Upgrade Listing | GalaPo Business",
    description: "Choose a plan to boost your business visibility.",
};

export const dynamic = "force-dynamic";

interface UpgradePageProps {
    searchParams: Promise<{ listing?: string }>;
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
    const session = await getServerSession();
    if (!session) return redirect("/login?callbackUrl=/business/subscription/upgrade");

    const { listing: listingId } = await searchParams;
    if (!listingId) {
        // If no listing in URL, redirect back to billing dashboard
        return redirect("/business/subscription");
    }

    const admin = createAdminSupabaseClient();

    let listing;
    try {
        listing = await ensureOwnedListing(session.user.id, listingId);
    } catch (e) {
        return notFound();
    }

    // Prepare full context for the wizard
    const [
        { data: subscriptions },
        { data: placements },
        { data: payments },
        pricing,
        categoriesMap
    ] = await Promise.all([
        admin.from("subscriptions").select("*").eq("listing_id", listingId),
        admin.from("top_search_placements").select("*").eq("listing_id", listingId),
        admin.from("payments").select("*").eq("listing_id", listingId).order("created_at", { ascending: false }).limit(1),
        getPricingSettings(),
        fetchCategoriesMap([listing.category_id, listing.subcategory_id])
    ]);

    // Format listing data using the helper to match the wizard's expected type
    const subscriptionItems = buildSubscriptionListItems({
        listings: [listing],
        subscriptions: subscriptions ?? [],
        placements: placements ?? [],
        payments: payments ?? [],
        categories: categoriesMap
    });

    const item = subscriptionItems[0];
    if (!item) return notFound();

    // If the item has a pending subscription, we need those specific payment instructions
    let paymentInstructions = null;
    if (item.subscription?.status === "pending_payment" || item.subscription?.status === "under_review") {
        paymentInstructions = await mapPaymentInstructionsFromAmount(item.subscription.amount || 0);
    }

    return (
        <div className="mx-auto max-w-5xl py-10 px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
                <Link 
                    href="/business/subscription" 
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B35] transition-colors hover:text-[#e85a25] mb-6"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Subscription & Billing
                </Link>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upgrade Listing</h1>
                <p className="mt-2 text-sm font-medium text-slate-500">Pick the best plan for your business and start reaching more customers.</p>
            </header>

            <UpgradeWizard 
                listing={item} 
                pricing={pricing} 
                paymentInstructions={paymentInstructions}
            />
        </div>
    );
}
