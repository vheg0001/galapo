"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, AlertCircle, Clock, ArrowUpCircle, Loader2, PartyPopper, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { getSubscriptionStatus, getDaysRemaining } from "@/lib/subscription-helpers";
import { EXPIRING_SOON_DAYS } from "@/lib/subscription-route-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { SubscriptionListItem } from "@/lib/types";
import ReactivationFlow from "./ReactivationFlow";

interface CurrentPlanCardProps {
    item: SubscriptionListItem;
    onUpgrade?: (listingId: string) => void;
    onRenew?: (listingId: string, subscriptionId: string) => void;
}

export default function CurrentPlanCard({ item, onUpgrade, onRenew }: CurrentPlanCardProps) {
    const router = useRouter();
    const [subscription, setSubscription] = useState(item.subscription);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showReactivateDialog, setShowReactivateDialog] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Sync state with props when they change (e.g. after router.refresh)
    useEffect(() => {
        setSubscription(item.subscription);
    }, [item.subscription]);

    // Clear success message after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const sub = subscription;
    
    // Determine the plan to display in the top badge. 
    // Prefer the plan_type from the subscription if it is currently active, 
    // even if the listing flags haven't caught up.
    let displayPlan: string = "free";
    if (sub) {
        const subStatus = getSubscriptionStatus(sub as any, 7);
        if (subStatus === "active" || subStatus === "expiring_soon" || subStatus === "cancelled") {
            displayPlan = sub.plan_type.toLowerCase();
        } else {
            displayPlan = item.current_plan;
        }
    }
    const hasPaidPlan = displayPlan !== "free";
    
    // Status styles mapping
    const statusConfig = {
        active: {
            color: "text-emerald-700 bg-emerald-50 border-emerald-100",
            icon: CheckCircle2,
            label: "Active"
        },
        expiring_soon: {
            color: "text-amber-700 bg-amber-50 border-amber-100",
            icon: AlertCircle,
            label: "Expiring Soon"
        },
        expired: {
            color: "text-rose-700 bg-rose-50 border-rose-100",
            icon: Clock,
            label: "Expired"
        },
        pending_payment: {
            color: "text-blue-700 bg-blue-50 border-blue-100",
            icon: Clock,
            label: "Pending Payment"
        },
        cancelled: {
            color: "text-slate-700 bg-slate-50 border-slate-100",
            icon: AlertCircle,
            label: "Cancelled"
        },
        under_review: {
            color: "text-sky-700 bg-sky-50 border-sky-100",
            icon: ArrowUpCircle,
            label: "Under Review"
        },
        deactivated: {
            color: "text-rose-700 bg-rose-50 border-rose-100",
            icon: AlertTriangle,
            label: "Deactivated"
        }
    };

    const isDeactivated = item.is_deactivated || item.listing_status === "deactivated";
    const currentStatus = isDeactivated ? "deactivated" : (sub?.status || "expired");
    const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.expired;
    const StatusIcon = config.icon;
    const canCancelAutoRenew =
        Boolean(sub?.id) &&
        Boolean(sub?.auto_renew) &&
        (currentStatus === "active" || currentStatus === "expiring_soon");
    const canEnableAutoRenew =
        Boolean(sub?.id) &&
        !sub?.auto_renew &&
        (currentStatus === "active" || currentStatus === "expiring_soon");
    const canCancelPendingRequest =
        Boolean(sub?.id) &&
        currentStatus === "pending_payment";

    const handleCancelAutoRenew = async () => {
        if (!sub?.id) return;

        setIsCancelling(true);

        try {
            const response = await fetch(`/api/business/subscriptions/${sub.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "cancel_auto_renew" }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to cancel auto-renew.");
            }

            setSubscription((current) => current ? { ...current, auto_renew: false } : current);
            setSuccessMessage("Renewal reminders have been successfully disabled.");
            setShowCancelDialog(false);
            router.refresh();
        } catch (error: any) {
            console.error("Failed to cancel auto-renew:", error);
            window.alert(error.message || "Failed to cancel auto-renew.");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleEnableRenewalReminder = async () => {
        if (!sub?.id) return;

        setIsCancelling(true);

        try {
            const response = await fetch(`/api/business/subscriptions/${sub.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "enable_renewal_reminder" }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to enable renewal reminder.");
            }

            setSubscription((current) => current ? { ...current, auto_renew: true } : current);
            setSuccessMessage("Renewal reminders have been successfully enabled.");
            router.refresh();
        } catch (error: any) {
            console.error("Failed to enable renewal reminder:", error);
            window.alert(error.message || "Failed to enable renewal reminder.");
        } finally {
            setIsCancelling(false);
        }
    };
    
    const handleCancelPendingRequest = async () => {
        if (!sub?.id) return;

        setIsCancelling(true);

        try {
            const response = await fetch(`/api/business/subscriptions/${sub.id}`, {
                method: "DELETE",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to cancel pending subscription request.");
            }

            setSuccessMessage("Subscription request was successfully cancelled.");
            setShowCancelDialog(false);
            router.refresh();
        } catch (error: any) {
            console.error("Failed to cancel pending subscription request:", error);
            window.alert(error.message || "Failed to cancel pending subscription request.");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
        <Card className="flex h-full flex-col overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md relative">
            {successMessage && (
                <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-all animate-in slide-in-from-top duration-300">
                    <PartyPopper className="h-4 w-4" />
                    {successMessage}
                </div>
            )}

            <CardHeader className="min-h-[110px] border-b border-slate-50 bg-slate-50/50 pb-4">
                <div className="flex h-full items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="line-clamp-2 text-lg font-bold text-slate-900">{item.listing_name}</CardTitle>
                        <CardDescription className="line-clamp-1 text-xs font-medium text-slate-500">
                            {item.category_name} {item.subcategory_name ? `· ${item.subcategory_name}` : ""}
                        </CardDescription>
                    </div>
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "rounded-full px-3 py-1 font-black uppercase tracking-wider",
                            displayPlan === "premium" ? "border-amber-200 bg-amber-50 text-amber-700" :
                            displayPlan === "featured" ? "border-orange-200 bg-orange-50 text-orange-700" :
                            "border-slate-200 bg-slate-100 text-slate-600"
                        )}
                    >
                        {displayPlan}
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 pt-6">
                {hasPaidPlan && sub ? (
                    <div className="space-y-6">
                        <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", config.color)}>
                            <StatusIcon className="h-5 w-5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold">{config.label}</p>
                                {sub.end_date && (
                                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                                        {format(new Date(sub.end_date), "MMMM d, yyyy")} ({sub.days_remaining} days left)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <Calendar className="h-3 w-3" />
                                    Billing Period
                                </p>
                                <p className="text-xs font-semibold text-slate-700">
                                    {sub.start_date ? format(new Date(sub.start_date), "MMM d") : "N/A"} - {sub.end_date ? format(new Date(sub.end_date), "MMM d, yyyy") : "N/A"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    Renewal Reminder
                                </p>
                                <p className="text-xs font-semibold text-slate-700">
                                    {sub.auto_renew ? "Active" : "Disabled"}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="mb-3 rounded-full bg-slate-100 p-3">
                            <ArrowUpCircle className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Free Listing</p>
                    </div>
                )}

                {sub?.status === "pending_payment" && (
                    <Alert className="mt-4 rounded-2xl border-blue-200 bg-blue-50/50">
                        <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-xs font-black uppercase tracking-tight text-blue-900">Pending Upgrade</AlertTitle>
                        <AlertDescription className="mt-1 text-xs font-medium text-blue-800/80">
                            You've started an upgrade to <strong>{sub.plan_type}</strong>. Please complete the payment to activate your new benefits.
                        </AlertDescription>
                    </Alert>
                )}

                {isDeactivated && (
                    <Alert variant="destructive" className="mt-6 rounded-2xl border-rose-200 bg-rose-50/50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-black uppercase tracking-tight">Listing Deactivated</AlertTitle>
                        <AlertDescription className="mt-1 text-xs font-medium text-rose-900/80">
                            Your listing has been deactivated because it failed the annual check. 
                            {item.reactivation_fee ? ` A reactivation fee of ₱${item.reactivation_fee.amount} is required.` : " Please contact support to reactivate."}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>

            <CardFooter className="mt-auto flex flex-col gap-2 border-t border-slate-50 bg-slate-50/30 pt-4">
                {sub?.status === "pending_payment" ? (
                    <div className="flex w-full flex-col gap-2">
                        <Button 
                            size="sm" 
                            className="w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                            asChild
                        >
                            <Link href={`/business/subscription/upgrade?listing=${item.listing_id}&step=3`}>
                                Proceed to Payment
                            </Link>
                        </Button>
                        <div className="flex w-full gap-2">
                            <Button 
                                variant="outline"
                                size="sm" 
                                className="flex-1 rounded-xl bg-white font-bold text-slate-700 hover:bg-slate-50"
                                asChild
                            >
                                <Link href={`/business/subscription/upgrade?listing=${item.listing_id}&step=2`}>
                                    Change Plan
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl border-rose-200 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => setShowCancelDialog(true)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : hasPaidPlan ? (
                    <div className="flex w-full gap-2">
                        {sub?.status === "expiring_soon" || sub?.status === "expired" ? (
                            <Button 
                                size="sm" 
                                className="flex-1 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                                onClick={() => onRenew?.(item.listing_id, sub?.id || "")}
                            >
                                Renew Now
                            </Button>
                        ) : null}
                        {canEnableAutoRenew ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl border-[#FF6B35] font-bold text-[#FF6B35] hover:bg-orange-50"
                                onClick={handleEnableRenewalReminder}
                                disabled={isCancelling}
                            >
                                {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Enable Reminder
                            </Button>
                        ) : null}
                        {canCancelAutoRenew ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    Disable Reminder
                                </Button>
                        ) : null}
                    </div>
                ) : isDeactivated ? (
                    <Button 
                        size="sm" 
                        className="w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                        onClick={() => setShowReactivateDialog(true)}
                    >
                        Reactivate Listing
                    </Button>
                ) : (
                    <Button 
                        size="sm" 
                        className="w-full rounded-xl bg-[#FF6B35] font-bold text-white hover:bg-[#e85a25]"
                        asChild
                    >
                        <Link href={`/business/subscription/upgrade?listing=${item.listing_id}`}>
                            Upgrade Listing
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
        {showCancelDialog ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                    <h3 className="text-lg font-black text-slate-900">
                        {canCancelPendingRequest ? "Cancel pending subscription?" : "Disable renewal reminders?"}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        {canCancelPendingRequest
                            ? "This pending subscription request will be removed."
                            : "You will no longer receive automatic renewal notifications for this listing."}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-slate-200"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={isCancelling}
                        >
                            Keep Subscription
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
                            onClick={canCancelPendingRequest ? handleCancelPendingRequest : handleCancelAutoRenew}
                            disabled={isCancelling}
                        >
                             {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm Disable
                        </Button>
                    </div>
                </div>
            </div>
        ) : null}

        {showReactivateDialog && (
            <ReactivationFlow
                item={item}
                onClose={() => setShowReactivateDialog(false)}
                onSuccess={() => {
                    setShowReactivateDialog(false);
                    setSuccessMessage("Reactivation request submitted. Our team will review it shortly.");
                    router.refresh();
                }}
            />
        )}
        </>
    );
}
