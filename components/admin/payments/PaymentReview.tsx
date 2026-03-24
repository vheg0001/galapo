"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    Calendar, 
    CreditCard, 
    User, 
    Building2, 
    FileText,
    Receipt,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Clock,
    UserCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge as StatusBadge } from "../../ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn as mergeClasses } from "../../../lib/utils";
import { formatPeso } from "../../../lib/subscription-helpers";
import ProofViewer from "./ProofViewer";
import VerifyDialog from "./VerifyDialog";
import RejectDialog from "./RejectDialog";

interface PaymentReviewProps {
    payment: any;
}

export default function PaymentReview({ payment }: PaymentReviewProps) {
    const router = useRouter();
    const [isVerifyOpen, setIsVerifyOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    const handleVerify = async () => {
        try {
            const response = await fetch(`/api/admin/payments/${payment.id}/verify`, {
                method: "POST"
            });
            const data = await response.json();
            if (data.success) {
                router.refresh();
                router.push("/admin/payments");
            } else {
                alert(data.error || "Verification failed");
            }
        } catch (error) {
            console.error("Verification error:", error);
            alert("An unexpected error occurred");
        }
    };

    const handleReject = async (reason: string) => {
        try {
            const response = await fetch(`/api/admin/payments/${payment.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason })
            });
            const data = await response.json();
            if (data.success) {
                router.refresh();
                router.push("/admin/payments");
            } else {
                alert(data.error || "Rejection failed");
            }
        } catch (error) {
            console.error("Rejection error:", error);
            alert("An unexpected error occurred");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-900 group" asChild>
                    <Link href="/admin/payments">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Payments
                    </Link>
                </Button>

                {payment.status === "pending" && (
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold"
                            onClick={() => setIsRejectOpen(true)}
                        >
                            Reject Payment
                        </Button>
                        <Button 
                            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100"
                            onClick={() => setIsVerifyOpen(true)}
                        >
                            Verify & Activate
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Proof Viewer */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <div className="bg-orange-500 p-1.5 rounded-lg">
                            <Receipt className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Payment Evidence</h2>
                    </div>
                    
                    <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-3xl">
                        <CardContent className="p-4">
                            <ProofViewer 
                                url={payment.signedProofUrl || payment.payment_proof_url} 
                                fileName={`Proof_${payment.reference_number || payment.id}.jpg`} 
                            />
                        </CardContent>
                    </Card>

                    {/* Historical Status Timeline? Skip for now, keep it simple */}
                </div>

                {/* Right Column: Information & Context */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Summary Card */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-indigo-500 p-1.5 rounded-lg">
                                <FileText className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Transaction Details</h2>
                        </div>

                        <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6 space-y-6">
                                {/* Amount Hero */}
                                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Payment Received</p>
                                    <div className="text-4xl font-black text-slate-900">{formatPeso(payment.amount)}</div>
                                    <div className="mt-2 flex justify-center">
                                        <StatusBadge 
                                            variant="default" 
                                            className={mergeClasses(
                                                "font-black uppercase tracking-widest text-[10px] border-none shadow-sm",
                                                payment.payment_method?.toLowerCase() === "gcash" ? "bg-[#007DFE] text-white" : 
                                                payment.payment_method?.toLowerCase() === "bank" ? "bg-indigo-600 text-white" : 
                                                "bg-slate-600 text-white"
                                            )}
                                        >
                                            {payment.payment_method}
                                        </StatusBadge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {payment.subscriptions?.plan_type && (
                                        <DetailItem 
                                            icon={<CreditCard className="h-4 w-4" />}
                                            label="Purchased Plan"
                                            value={
                                                <span className={mergeClasses(
                                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                    payment.subscriptions.plan_type === "premium" 
                                                        ? "border-amber-400/50 bg-gradient-to-br from-[#FFD700] via-[#FFF4B0] to-[#B8860B] text-black" 
                                                        : payment.subscriptions.plan_type === "featured"
                                                            ? "border-secondary/20 bg-secondary text-white"
                                                            : "border-gray-200 bg-gray-50 text-gray-600"
                                                )}>
                                                    {payment.subscriptions.plan_type}
                                                </span>
                                            }
                                        />
                                    )}
                                    <DetailItem 
                                        icon={<CreditCard className="h-4 w-4" />}
                                        label="Reference Number"
                                        value={payment.reference_number || "Not provided"}
                                        className="font-mono text-indigo-600"
                                    />
                                    <DetailItem 
                                        icon={<Calendar className="h-4 w-4" />}
                                        label="Date Uploaded"
                                        value={format(new Date(payment.created_at), "MMMM d, yyyy 'at' h:mm a")}
                                    />
                                    <DetailItem 
                                        icon={<Clock className="h-4 w-4" />}
                                        label="Status"
                                        value={
                                            <StatusBadge className={mergeClasses(
                                                "font-black uppercase tracking-widest text-[9px]",
                                                payment.status === "pending" ? "bg-amber-100 text-amber-600 hover:bg-amber-100" :
                                                payment.status === "verified" ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-100" :
                                                "bg-rose-100 text-rose-600 hover:bg-rose-100"
                                            )}>
                                                {payment.status}
                                            </StatusBadge>
                                        }
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Business Context */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="bg-emerald-500 p-1.5 rounded-lg">
                                <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Business Context</h2>
                        </div>

                        <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-lg text-slate-900 leading-tight">
                                            {payment.listings?.business_name}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                                            {payment.description}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400 hover:bg-slate-50 hover:text-slate-900" asChild>
                                        <Link href={`/listing/${payment.listings?.slug}`} target="_blank">
                                            <ExternalLink className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                </div>

                                <div className="h-px bg-slate-100" />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                            <UserCircle2 className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="space-y-0.5 overflow-hidden">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Owner</p>
                                            <p className="font-bold text-slate-900 truncate">{payment.profiles?.full_name}</p>
                                            <p className="text-xs text-slate-500 truncate">{payment.profiles?.email}</p>
                                        </div>
                                    </div>

                                    {payment.rejection_reason && payment.status === "rejected" && (
                                        <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
                                            <div className="flex gap-3">
                                                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-rose-900 uppercase tracking-wider">Previous Rejection Reason</p>
                                                    <p className="text-xs font-medium text-rose-700 leading-relaxed italic">
                                                        "{payment.rejection_reason}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <VerifyDialog 
                isOpen={isVerifyOpen}
                onClose={() => setIsVerifyOpen(false)}
                onConfirm={handleVerify}
                amount={payment.amount}
                businessName={payment.listings?.business_name}
            />
            <RejectDialog 
                isOpen={isRejectOpen}
                onClose={() => setIsRejectOpen(false)}
                onConfirm={handleReject}
                amount={payment.amount}
                businessName={payment.listings?.business_name}
            />
        </div>
    );
}

function DetailItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: React.ReactNode, className?: string }) {
    return (
        <div className="flex items-start justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {icon}
                <span>{label}</span>
            </div>
            <div className={mergeClasses("font-black text-slate-900 text-right", className)}>
                {value}
            </div>
        </div>
    );
}
