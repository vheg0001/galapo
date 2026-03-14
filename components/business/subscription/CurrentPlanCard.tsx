"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, AlertCircle, Clock, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SubscriptionListItem } from "@/lib/types";

interface CurrentPlanCardProps {
    item: SubscriptionListItem;
    onUpgrade?: (listingId: string) => void;
    onRenew?: (listingId: string, subscriptionId: string) => void;
}

export default function CurrentPlanCard({ item, onUpgrade, onRenew }: CurrentPlanCardProps) {
    const hasPaidPlan = item.current_plan !== "free";
    const sub = item.subscription;
    
    // Status styles mapping
    const statusConfig = {
        active: {
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
            icon: CheckCircle2,
            label: "Active"
        },
        expiring_soon: {
            color: "text-amber-600 bg-amber-50 border-amber-100",
            icon: AlertCircle,
            label: "Expiring Soon"
        },
        expired: {
            color: "text-rose-600 bg-rose-50 border-rose-100",
            icon: Clock,
            label: "Expired"
        },
        pending_payment: {
            color: "text-blue-600 bg-blue-50 border-blue-100",
            icon: Clock,
            label: "Pending Verification"
        },
        cancelled: {
            color: "text-slate-600 bg-slate-50 border-slate-100",
            icon: AlertCircle,
            label: "Cancelled"
        }
    };

    const currentStatus = sub?.status || "expired";
    const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.expired;
    const StatusIcon = config.icon;

    return (
        <Card className="flex h-full flex-col overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md">
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
                            item.current_plan === "premium" ? "border-amber-200 bg-amber-50 text-amber-700" :
                            item.current_plan === "featured" ? "border-orange-200 bg-orange-50 text-orange-700" :
                            "border-slate-200 bg-slate-100 text-slate-600"
                        )}
                    >
                        {item.current_plan}
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
                                    <p className="text-xs opacity-80">
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
                                    Auto-Renew
                                </p>
                                <p className="text-xs font-semibold text-slate-700">
                                    {sub.auto_renew ? "Enabled" : "Disabled"}
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
                        <p className="mt-1 text-xs text-slate-500">Upgrade to get more visibility and features.</p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="mt-auto flex flex-col gap-2 border-t border-slate-50 bg-slate-50/30 pt-4">
                {hasPaidPlan ? (
                    <div className="flex w-full gap-2">
                        {item.subscription?.status === "expiring_soon" || item.subscription?.status === "expired" ? (
                            <Button 
                                size="sm" 
                                className="flex-1 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700"
                                onClick={() => onRenew?.(item.listing_id, sub?.id || "")}
                            >
                                Renew Now
                            </Button>
                        ) : null}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                            asChild
                        >
                            <Link href={`/business/subscription/upgrade?listing=${item.listing_id}`}>
                                Change Plan
                            </Link>
                        </Button>
                    </div>
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
    );
}
