import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPeso, getDaysRemaining } from "@/lib/subscription-helpers";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function SubscriptionDetail({
    subscription,
    listing,
    owner
}: {
    subscription: any;
    listing: any;
    owner: any;
}) {
    const daysRemaining = subscription.end_date ? getDaysRemaining(subscription.end_date) : 0;
    const isExpired = subscription.end_date ? new Date(subscription.end_date) < new Date() : false;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>Status & Plan</span>
                        <StatusBadge
                            status={subscription.status}
                        />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Plan Type</p>
                            <span className={cn(
                                "inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm",
                                subscription.plan_type === "premium" 
                                    ? "border-amber-400/50 bg-gradient-to-br from-[#FFD700] via-[#FFF4B0] to-[#B8860B] text-black" 
                                    : subscription.plan_type === "featured"
                                        ? "border-secondary/20 bg-secondary text-white"
                                        : "border-gray-200 bg-gray-50 text-gray-600"
                            )}>
                                {subscription.plan_type}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount</p>
                            <p className="font-medium text-lg">{formatPeso(subscription.amount)}</p>
                        </div>
                    </div>

                    <div className="h-px bg-border/50 my-4" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Starts On</p>
                            <p className="text-sm font-medium">
                                {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : "Pending"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expires On</p>
                            <p className="text-sm font-medium">
                                {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : "None"}
                            </p>
                        </div>
                    </div>

                    {subscription.status === "active" && !isExpired && (
                        <div className="mt-4 p-3 rounded-xl bg-muted/40 border text-sm flex justify-between items-center">
                            <span className="font-medium">Time Remaining</span>
                            <span className="font-bold text-primary">{daysRemaining} days</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>Listing Details</span>
                        {listing && (
                            <Link href={`/admin/listings/${listing.id}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                View Full
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Business Name</p>
                        <p className="font-medium text-lg">{listing ? listing.business_name : "Unknown Listing"}</p>
                    </div>

                    <div className="h-px bg-border/50 my-4" />

                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Owner Information</p>
                        <p className="font-medium">{owner ? owner.full_name : "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{owner ? owner.email : "N/A"}</p>
                        {owner?.id && (
                            <Link href={`/admin/users/${owner.id}`} className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block">
                                View User Profile
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
