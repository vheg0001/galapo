import Link from "next/link";
import { Building2, CreditCard, ShieldCheck, Plus, MonitorPlay, Calendar, Tag } from "lucide-react";

interface QuickActionsProps {
    pendingListings: number;
    pendingPayments: number;
    pendingClaims: number;
}

export default function QuickActions({ pendingListings, pendingPayments, pendingClaims }: QuickActionsProps) {
    const actions = [
        {
            href: "/admin/listings?status=pending",
            label: "Review Listings",
            count: pendingListings,
            icon: Building2,
            color: "bg-blue-600 hover:bg-blue-700",
        },
        {
            href: "/admin/payments?status=pending",
            label: "Verify Payments",
            count: pendingPayments,
            icon: CreditCard,
            color: "bg-emerald-600 hover:bg-emerald-700",
        },
        {
            href: "/admin/claims?status=pending",
            label: "Process Claims",
            count: pendingClaims,
            icon: ShieldCheck,
            color: "bg-orange-600 hover:bg-orange-700",
        },
        {
            href: "/admin/blog/new",
            label: "Create Blog Post",
            count: null,
            icon: Plus,
            color: "bg-[#0F1A2E] hover:bg-[#1a2d4f]",
        },
        {
            href: "/admin/deals/new",
            label: "Create Deal",
            count: null,
            icon: Tag,
            color: "bg-rose-600 hover:bg-rose-700",
        },
        {
            href: "/admin/events",
            label: "Create Event",
            count: null,
            icon: Calendar,
            color: "bg-indigo-600 hover:bg-indigo-700",
        },
        {
            href: "/admin/ads",
            label: "Manage Ads",
            count: null,
            icon: MonitorPlay,
            color: "bg-purple-600 hover:bg-purple-700",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {actions.map((action) => (
                <Link
                    key={action.href}
                    href={action.href}
                    className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-500 group-hover:scale-110 ${action.color.split(' ')[0]}`}>
                        <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-tight text-foreground">{action.label}</p>
                    </div>

                    {action.count !== null && action.count > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white shadow-md ring-2 ring-background animate-in zoom-in-0 duration-500">
                            {action.count}
                        </span>
                    )}

                    {/* Hover Glow */}
                    <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/5 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
            ))}
        </div>
    );
}
