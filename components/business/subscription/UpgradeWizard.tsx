"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import PlanSelector from "./PlanSelector";
import PaymentInstructions from "./PaymentInstructions";
import PaymentProofUpload from "./PaymentProofUpload";
import OrderSummary from "./OrderSummary";
import { cn } from "@/lib/utils";
import type { SubscriptionListItem, PlanTier, PricingResponse } from "@/lib/types";

interface UpgradeWizardProps {
    listing: SubscriptionListItem;
    pricing: PricingResponse;
}

export default function UpgradeWizard({ listing, pricing }: UpgradeWizardProps) {
    const router = useRouter();
    const store = useSubscriptionStore();
    const [verifying, setVerifying] = useState(false);

    // Sync listing with store once
    useEffect(() => {
        store.setSelectedListing(listing);
        store.setCurrentStep(2);
    }, [listing.listing_id]);

    const activeStep = store.currentStep;

    const handleNext = async () => {
        if (activeStep === 2) {
            try {
                await store.initiateSubscription();
            } catch (err: any) {
                console.error("Initiation failed:", err);
            }
        } else if (activeStep === 3) {
            try {
                await store.submitPayment();
            } catch (err: any) {
                console.error("Submission failed:", err);
            }
        } else {
            store.nextStep();
        }
    };

    const steps = [
        { id: 2, title: "Select Plan" },
        { id: 3, title: "Payment" },
        { id: 4, title: "Complete" }
    ];

    if (activeStep === 4) {
        return (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Submitted!</h2>
                <div className="mt-4 max-w-sm space-y-4">
                    <p className="text-base font-medium text-slate-600 leading-relaxed">
                        Your payment proof has been uploaded. Our team will verify it within 24 hours.
                    </p>
                    <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                        <p className="text-sm font-bold text-amber-800">
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
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => store.resetFlow()}
                        className="rounded-2xl font-bold text-slate-500"
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            {/* Step Indicator */}
            <div className="mb-10 flex items-center justify-center">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all",
                            activeStep === step.id
                                ? "bg-[#FF6B35] text-white shadow-lg shadow-orange-200"
                                : activeStep > step.id
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                        )}>
                            {activeStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id - 1}
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

            <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
                <div className="space-y-8">
                    {activeStep === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Choose your next level</h2>
                                <p className="text-sm font-medium text-slate-500">Pick the plan that works best for {listing.listing_name}</p>
                            </div>
                            <PlanSelector
                                currentPlan={listing.current_plan}
                                selectedPlan={store.selectedPlan}
                                onSelect={store.setSelectedPlan}
                                pricing={pricing}
                                pendingPlan={(listing.subscription?.status === "pending_payment" || listing.subscription?.status === "under_review") ? listing.subscription?.plan_type : undefined}
                                pendingStatus={listing.subscription?.status as any}
                            />
                        </div>
                    )}

                    {activeStep === 3 && (
                        <div className="space-y-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Submit Payment</h2>
                                <p className="text-sm font-medium text-slate-500">Follow the instructions to complete your upgrade.</p>
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
                        {activeStep > 2 && (
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
                            {store.isSubmitting && <Loader2 className="h-4 w-4 animate-spin text-[#FF6B35]" />}
                            <Button
                                disabled={
                                    (activeStep === 2 && !store.selectedPlan) ||
                                    (activeStep === 3 && !store.paymentProof) ||
                                    store.isSubmitting
                                }
                                onClick={handleNext}
                                className="rounded-xl bg-slate-900 px-8 py-6 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-none"
                            >
                                {activeStep === 2 ? "Continue to Payment" :
                                    activeStep === 3 ? "Submit Proof of Payment" :
                                        "Finish"}
                                {activeStep < 4 ? <ArrowRight className="ml-2 h-4 w-4" /> : <ShoppingBag className="ml-2 h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="hidden lg:block">
                    <div className="sticky top-24 space-y-4">
                        <OrderSummary
                            listingName={listing.listing_name}
                            plan={store.selectedPlan || listing.current_plan}
                            price={
                                store.selectedPlan === "premium" ? pricing.premium_monthly :
                                    store.selectedPlan === "featured" ? pricing.featured_monthly : 0
                            }
                        />
                        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">Notice</p>
                            <p className="text-xs font-medium text-amber-900 leading-relaxed">
                                Your listing benefits will activate immediately after our admin team verifies your payment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
