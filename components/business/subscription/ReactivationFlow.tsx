"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogPortal,
    DialogOverlay,
} from "@/components/ui/dialog";
import PaymentInstructions from "./PaymentInstructions";
import PaymentProofUpload from "./PaymentProofUpload";
import type { SubscriptionListItem, PaymentInstructionsConfig } from "@/lib/types";
import { formatPeso } from "@/lib/subscription-helpers";

interface ReactivationFlowProps {
    item: SubscriptionListItem;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReactivationFlow({ item, onClose, onSuccess }: ReactivationFlowProps) {
    const [step, setStep] = useState<"instructions" | "upload" | "success">("instructions");
    const [paymentMethod, setPaymentMethod] = useState<"gcash" | "bank_transfer">("gcash");
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [referenceNumber, setReferenceNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [instructions, setInstructions] = useState<PaymentInstructionsConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInstructions() {
            try {
                const res = await fetch("/api/business/payment-instructions");
                const data = await res.json();
                if (data.success) {
                    // Overwrite the amount with the reactivation fee amount
                    const feeAmount = item.reactivation_fee?.amount || 500; // Default if not found
                    setInstructions({ ...data.data, amount: feeAmount });
                }
            } catch (err) {
                console.error("Failed to fetch instructions:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchInstructions();
    }, [item.reactivation_fee?.amount]);

    const handleSubmit = async () => {
        if (!paymentProof) {
            setError("Please upload your payment proof.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("listingId", item.listing_id);
            formData.append("amount", String(instructions?.amount || 0));
            formData.append("paymentMethod", paymentMethod);
            formData.append("referenceNumber", referenceNumber);
            formData.append("file", paymentProof);
            if (item.reactivation_fee?.id) {
                formData.append("reactivationFeeId", item.reactivation_fee.id);
            }

            const res = await fetch("/api/business/reactivate", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit reactivation request.");
            }

            setStep("success");
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogPortal>
                <DialogOverlay className="bg-slate-950/40 backdrop-blur-[2px] fixed inset-0 z-50" />
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-none p-0 sm:max-w-xl fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%] bg-white shadow-2xl">
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="bg-slate-50 px-8 py-8 border-b border-slate-100">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-left">
                                    Reactivate Listing
                                </DialogTitle>
                                <DialogDescription className="text-sm font-medium text-slate-500 mt-1 text-left">
                                    Submit payment to bring "{item.listing_name}" back online.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-8">
                            {loading ? (
                                <div className="flex h-60 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : step === "instructions" ? (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 rounded-2xl bg-blue-50 p-4 border border-blue-100">
                                        <div className="rounded-full bg-blue-600 p-2 text-white">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-900 uppercase tracking-tight">Reactivation Fee</p>
                                            <p className="text-lg font-black text-blue-600">{formatPeso(instructions?.amount || 0)}</p>
                                        </div>
                                    </div>

                                    <PaymentInstructions
                                        config={instructions!}
                                        method={paymentMethod}
                                        onMethodChange={setPaymentMethod}
                                    />

                                    <Button
                                        onClick={() => setStep("upload")}
                                        className="w-full rounded-2xl bg-slate-900 py-6 font-bold text-white hover:bg-slate-800 h-auto"
                                    >
                                        I've Made the Payment
                                    </Button>
                                </div>
                            ) : step === "upload" ? (
                                <div className="space-y-8">
                                    <PaymentProofUpload
                                        onFileSelect={setPaymentProof}
                                        onReferenceChange={setReferenceNumber}
                                        referenceNumber={referenceNumber}
                                        error={error}
                                    />

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep("instructions")}
                                            className="rounded-2xl border-slate-200 font-bold h-12 px-6"
                                            disabled={isSubmitting}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            className="flex-1 rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800 h-12"
                                            disabled={isSubmitting || !paymentProof}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                            ) : (
                                                "Submit Proof of Payment"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="mb-6 rounded-full bg-emerald-100 p-4 text-emerald-600">
                                        <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Request Submitted!</h3>
                                    <p className="mt-2 text-sm font-medium text-slate-500">
                                        Our team will verify your payment and reactivate your listing shortly.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}
