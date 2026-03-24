import { CheckCircle2, Clock, PlayCircle, StopCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// A simplistic timeline. In a real app, this would query an audit log or events table.
// Here we piece it together based on the subscription dates and payments.
export function SubscriptionTimeline({
    subscription,
    payments
}: {
    subscription: any;
    payments: any[];
}) {
    const events = [];

    events.push({
        id: "created",
        title: "Subscription Created",
        description: `Plan: ${subscription.plan_type}`,
        date: subscription.created_at,
        icon: <PlayCircle className="h-4 w-4" />,
        color: "text-blue-500 bg-blue-50 border-blue-200"
    });

    if (subscription.start_date) {
        events.push({
            id: "started",
            title: "Subscription Started",
            description: "Activated and listing upgraded.",
            date: subscription.start_date,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: "text-emerald-500 bg-emerald-50 border-emerald-200"
        });
    }

    // Add payment events
    payments.forEach(payment => {
        events.push({
            id: `payment_${payment.id}`,
            title: payment.status === "paid" || payment.status === "verified" ? "Payment Successful" : `Payment: ${payment.status}`,
            description: `Amount: Php ${payment.amount} (${payment.payment_method || "Unknown"})`,
            date: payment.created_at,
            icon: payment.status === "paid" || payment.status === "verified" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />,
            color: payment.status === "paid" || payment.status === "verified" ? "text-emerald-500 bg-emerald-50 border-emerald-200" : "text-amber-500 bg-amber-50 border-amber-200"
        });
    });

    if (subscription.status === "expired" || subscription.status === "cancelled") {
        events.push({
            id: "ended",
            title: "Subscription Ended",
            description: `Status: ${subscription.status}`,
            date: subscription.updated_at || subscription.end_date, // Approximate for ending time if updated_at is missing
            icon: <StopCircle className="h-4 w-4" />,
            color: "text-red-500 bg-red-50 border-red-200"
        });
    }

    if (subscription.status === "active" && subscription.auto_renew) {
         events.push({
            id: "renew",
            title: "Renewal Reminder Active",
            description: `A reminder will be sent before ${new Date(subscription.end_date).toLocaleDateString()} to facilitate manual renewal.`,
            date: subscription.end_date,
            icon: <RefreshCw className="h-4 w-4" />,
            color: "text-gray-500 bg-gray-50 border-gray-200 text-muted-foreground",
            isFuture: true
        });
    }

    // Sort events by date ascending
    events.sort((a, b) => {
        if (!a.date) return -1;
        if (!b.date) return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold">Timeline</h3>
            <div className="relative border-l-2 border-border/50 ml-4 space-y-8 pb-4">
                {events.map((event, index) => (
                    <div key={index} className={cn("relative pl-8", event.isFuture && "opacity-60")}>
                        <div className={cn(
                            "absolute flex items-center justify-center -left-[17px] w-8 h-8 rounded-full border bg-white",
                            event.color
                        )}>
                            {event.icon}
                        </div>
                        <div className="flex flex-col">
                            <h4 className="text-sm font-bold">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                            {event.date && (
                                <time className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">
                                    {new Date(event.date).toLocaleString()}
                                </time>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
