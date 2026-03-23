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
            <div className="relative space-y-1 py-4">
                {/* Timeline Line */}
                <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-border/40" />

                {activities.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No recent activity.</p>
                ) : (
                    activities.map((activity, idx) => {
                        const cfg = TYPE_CONFIG[activity.type] ?? { icon: Building2, color: "bg-gray-100 text-gray-500" };
                        const Icon = cfg.icon;
                        return (
                            <div key={activity.id} className="group relative flex items-start gap-4 px-5 py-3 transition-colors hover:bg-muted/30">
                                <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background transition-transform duration-300 group-hover:scale-110 ${cfg.color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-foreground leading-none">{activity.title}</p>
                                        <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 tabular-nums">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">"{activity.message}"</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
