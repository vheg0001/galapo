"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Rocket, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import TopSearchSelector from "@/components/business/subscription/TopSearchSelector";
import PaymentInstructions from "@/components/business/subscription/PaymentInstructions";
import PaymentProofUpload from "@/components/business/subscription/PaymentProofUpload";
import OrderSummary from "@/components/business/subscription/OrderSummary";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/subscription-helpers";

export default function TopSearchPurchasePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const listingId = searchParams.get("listing");
    const store = useSubscriptionStore();

    const [listing, setListing] = useState<any>(null);
    const [pricing, setPricing] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!listingId) {
            router.push("/business/subscription/top-search");
            return;
        }

        async function loadContext() {
            try {
                const response = await fetch(`/api/business/listings/${listingId}`);
                const data = await response.json();
                if (response.ok) {
                    const normalizedListing = {
                        ...data,
                        id: data.id ?? data.listing_id,
                        business_name: data.business_name ?? data.listing_name,
                        listing_id: data.listing_id ?? data.id,
                        listing_name: data.listing_name ?? data.business_name,
                        current_plan: data.current_plan ?? "free",
                        subscription: data.subscription ?? null,
                        top_search_placements: data.top_search_placements ?? [],
                    };

                    setListing(normalizedListing);
                    store.setSelectedListing(normalizedListing);

                    // Handle Resumption
                    const resume = searchParams.get("resume") === "1";
                    const catId = searchParams.get("category");
                    const pos = searchParams.get("position");

                    if (resume && catId && pos) {
                        // Fetch category details to populate store
                        const catRes = await fetch(`/api/categories?ids=${catId}`);
                        const catData = await catRes.json();
                        if (catData.data && catData.data[0]) {
                            store.setSelectedTopSearchCategory(catData.data[0]);
                            store.setSelectedPosition(parseInt(pos));
                            
                            // Initialize and skip to payment
                            await store.initiateTopSearch();
                        } else {
                            store.setCurrentStep(5);
                        }
                    } else {
                        // Initialize top search flow
                        store.setCurrentStep(5);
                    }
                } else {
                    router.push("/business/subscription/top-search");
                }

                const priceRes = await fetch("/api/pricing");
                const priceData = await priceRes.json();
                setPricing(priceData);
            } catch (err) {
                console.error("Failed to load context:", err);
            } finally {
                setLoading(false);
            }
        }
        loadContext();
    }, [listingId, searchParams]);

    const activeStep = store.currentStep;

    const handleNext = async () => {
        if (activeStep === 5) {
            // Initiate top search placement
            try {
                await store.initiateTopSearch();
            } catch (err) {
                console.error("Top search initiation failed:", err);
            }
        } else if (activeStep === 6) {
            // Submit top search payment
            try {
                await store.submitPayment();
            } catch (err) {
                console.error("Top search submission failed:", err);
            }
        } else {
            store.nextStep();
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Preparing your boost…</p>
            </div>
        );
    }

    if (activeStep === 7) {
        return (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-inner">
                    <Rocket className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Placement Requested!</h2>
                <div className="mt-4 max-w-sm space-y-4">
                    <p className="text-base font-medium text-slate-600 leading-relaxed">
                        Your payment proof for Top Search Placement has been uploaded. We'll verify it shortly.
                    </p>
                    <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                        <p className="text-sm font-bold text-blue-800">
                            Status: Pending Verification
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
                    <Button
                        size="lg"
                        onClick={() => router.push("/business/subscription")}
                        className="rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                    >
                        Go to Billing Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const steps = [
        { id: 5, title: "Select Slot" },
        { id: 6, title: "Payment" },
        { id: 7, title: "Complete" }
    ];

    return (
        <div className="mx-auto max-w-5xl py-10 px-4">
            {/* Step Indicator */}
            <div className="mb-10 flex items-center justify-center">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all",
                            activeStep === step.id
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                : activeStep > step.id
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                        )}>
                            {activeStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={cn(
                                "h-1 w-10 mx-2 rounded-full transition-colors",
                                activeStep > step.id ? "bg-emerald-200" : "bg-slate-100"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                <div className="space-y-8">
                    {activeStep === 5 && (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Top Search Placement</h2>
                                <p className="text-sm font-medium text-slate-500">Choose where you want {listing.business_name} to appear.</p>
                            </div>
                            <TopSearchSelector
                                listingId={listing.id}
                                categoryId={listing.category_id}
                                subcategoryId={listing.subcategory_id}
                                selectedCategory={store.selectedTopSearchCategory}
                                selectedPosition={store.selectedPosition}
                                onSelectCategory={store.setSelectedTopSearchCategory}
                                onSelectPosition={store.setSelectedPosition}
                            />
                        </div>
                    )}

                    {activeStep === 6 && (
                        <div className="space-y-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Submit Payment</h2>
                                <p className="text-sm font-medium text-slate-500">Follow the instructions to activate your top placement.</p>
                            </div>

                            <PaymentInstructions
                                config={store.paymentInstructions!}
                                method={store.paymentMethod}
                                onMethodChange={store.setPaymentMethod}
                            />

                            <div className="pt-2">
                                <PaymentProofUpload
                                    onFileSelect={store.setPaymentProof}
                                    onReferenceChange={store.setReferenceNumber}
                                    referenceNumber={store.referenceNumber}
                                    error={store.error}
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                        {activeStep > 5 && (
                            <Button
                                variant="outline"
                                onClick={store.prevStep}
                                className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        )}
                        <div className="ml-auto flex items-center gap-4">
                            {store.isSubmitting && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                            <Button
                                disabled={
                                    (activeStep === 5 && (!store.selectedTopSearchCategory || !store.selectedPosition)) ||
                                    (activeStep === 6 && !store.paymentProof) ||
                                    store.isSubmitting
                                }
                                onClick={handleNext}
                                className="rounded-xl bg-slate-900 px-8 py-6 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-none"
                            >
                                {activeStep === 5 ? "Continue to Payment" :
                                    activeStep === 6 ? "Submit Payment Proof" :
                                        "Finish"}
                                {activeStep < 7 ? <ArrowRight className="ml-2 h-4 w-4" /> : <ShoppingBag className="ml-2 h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 space-y-4">
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="bg-blue-600 px-6 py-4">
                                <h3 className="flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.15em] text-white">
                                    <Rocket className="h-4 w-4" />
                                    Placement Summary
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business</p>
                                        <p className="text-sm font-black text-slate-900">{listing.business_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                                        <p className="text-sm font-black text-slate-900">{store.selectedTopSearchCategory?.name || "Not selected"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desired Position</p>
                                        <p className="text-sm font-black text-blue-600">
                                            {store.selectedPosition ? `#${store.selectedPosition} in Category` : "Not selected"}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-black text-slate-900">Total Price</span>
                                        <span className="text-2xl font-black text-slate-900">{formatPeso(pricing?.top_search_monthly || 999)}</span>
                                    </div>
                                    <p className="mt-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">One-time payment for 30 days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
