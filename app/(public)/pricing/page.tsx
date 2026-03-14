import type { Metadata } from "next";
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

            <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="mx-auto max-w-7xl space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">
                            Boost Your Visibility Even More
                        </h2>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <AddOnCard
                            title={dynamicTopSearch?.name || ADD_ONS.topSearch.title}
                            description={dynamicTopSearch?.description || ADD_ONS.topSearch.description}
                            price={parsePackagePrice(dynamicTopSearch?.price || "", pricing.top_search_monthly)}
                            periodLabel="/month per category"
                            features={dynamicTopSearch?.features || ADD_ONS.topSearch.features}
                            buttonLabel={dynamicTopSearch?.button_text || ADD_ONS.topSearch.buttonLabel}
                            buttonHref={dynamicTopSearch?.button_link || ADD_ONS.topSearch.buttonHref}
                            availabilityLabel={ADD_ONS.topSearch.availabilityLabel}
                            accent="gold"
                        />

                        <AddOnCard
                            title={dynamicBannerAds?.name || ADD_ONS.bannerAds.title}
                            description={dynamicBannerAds?.description || ADD_ONS.bannerAds.description}
                            price={parsePackagePrice(dynamicBannerAds?.price || "", pricing.ad_placement_monthly)}
                            periodLabel="/month per slot"
                            features={dynamicBannerAds?.features || ADD_ONS.bannerAds.features}
                            buttonLabel={dynamicBannerAds?.button_text || ADD_ONS.bannerAds.buttonLabel}
                            buttonHref={dynamicBannerAds?.button_link || ADD_ONS.bannerAds.buttonHref}
                            accent="orange"
                        />
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