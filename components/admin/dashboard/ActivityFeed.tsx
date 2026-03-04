import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    Building2, CreditCard, ShieldCheck, CheckCircle, UserPlus,
    ClipboardList, AlertCircle
} from "lucide-react";

interface Activity {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    data?: Record<string, any>;
}

const TYPE_CONFIG: Record<string, { icon: typeof Building2; color: string }> = {
    new_listing_submitted: { icon: Building2, color: "bg-blue-100 text-blue-600" },
    new_payment_uploaded: { icon: CreditCard, color: "bg-emerald-100 text-emerald-600" },
    new_claim_request: { icon: ShieldCheck, color: "bg-orange-100 text-orange-600" },
    listing_approved: { icon: CheckCircle, color: "bg-green-100 text-green-600" },
    listing_rejected: { icon: AlertCircle, color: "bg-red-100 text-red-600" },
    annual_check: { icon: ClipboardList, color: "bg-purple-100 text-purple-600" },
    annual_check_flagged: { icon: AlertCircle, color: "bg-red-100 text-red-600" },
};

interface ActivityFeedProps {
    activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <div className="rounded-2xl border border-border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
                <Link href="/admin/notifications" className="text-xs font-medium text-[#FF6B35] hover:underline">
                    View all
                </Link>
            </div>
            <div className="divide-y divide-border">
                {activities.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No recent activity.</p>
                ) : (
                    activities.map((activity) => {
                        const cfg = TYPE_CONFIG[activity.type] ?? { icon: Building2, color: "bg-gray-100 text-gray-500" };
                        const Icon = cfg.icon;
                        return (
                            <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5">
                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground leading-snug">{activity.title}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{activity.message}</p>
                                </div>
                                <span className="shrink-0 text-[10px] text-muted-foreground/70 whitespace-nowrap pt-1">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
