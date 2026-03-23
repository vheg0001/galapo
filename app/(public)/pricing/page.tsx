import type { Metadata } from "next";
import Link from "next/link";
import PricingTable from "@/components/public/pricing/PricingTable";
import AddOnCard from "@/components/public/pricing/AddOnCard";
import PricingFAQ from "@/components/public/pricing/PricingFAQ";
import { ADD_ONS } from "@/lib/subscription-config";
import { getPricingSettings, findPackageByAlias, parsePackagePrice } from "@/lib/subscription-helpers";

export const metadata: Metadata = {
    title: "Pricing — Business Listing Plans | GalaPo",
    description:
        "Choose the right plan for your business. Free, Featured, or Premium listings in Olongapo City.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
    const pricing = await getPricingSettings().catch(() => ({
        featured_monthly: 299,
        premium_monthly: 599,
        top_search_monthly: 999,
        ad_placement_monthly: 1499,
        advertising_packages: [],
    }));

    // Find dynamic add-ons if they exist
    const dynamicTopSearch = findPackageByAlias(pricing.advertising_packages || [], [
        "top search", "top placement", "sponsored placement", "sponsored search"
    ]);
    const dynamicBannerAds = findPackageByAlias(pricing.advertising_packages || [], [
        "banner ads", "ad placement", "banner assignment", "display ads"
    ]);

    return (
        <div className="bg-slate-50">
            {/* ... header remains same ... */}
            <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
                <div className="mx-auto max-w-5xl text-center">
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-[#FF6B35]">
                        Business Plans
                    </p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                        Choose Your Plan
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                        Get more visibility for your business in Olongapo City.
                    </p>
                </div>
            </section>

            <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="mx-auto max-w-7xl">
                    <PricingTable initialPricing={pricing} />
                </div>
            </section>

            {/* Need More Visibility CTA */}
            <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16 bg-white border-y border-slate-200">
                <div className="mx-auto max-w-4xl text-center space-y-6">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Need More Visibility?
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-slate-600">
                        Go beyond listings with our targeted advertising solutions. Banner ads, top search placements, and custom promotions are available to help you reach even more customers.
                    </p>
                    <div className="pt-4">
                        <Link
                            href="/advertise"
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#FF6B35] px-10 text-sm font-bold text-white transition-all hover:bg-[#e85a25] hover:shadow-lg active:scale-95"
                        >
                            Explore Advertising Options
                        </Link>
                    </div>
                </div>
            </section>

            <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="mx-auto max-w-4xl space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
                    </div>
                    <PricingFAQ />
                </div>
            </section>
        </div>
    );
}