import Link from "next/link";
import { Building2, CreditCard, ShieldCheck, Plus, MonitorPlay } from "lucide-react";

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
            href: "/admin/ads",
            label: "Manage Ads",
            count: null,
            icon: MonitorPlay,
            color: "bg-purple-600 hover:bg-purple-700",
        },
    ];

    return (
        <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
                <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${action.color}`}
                >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                    {action.count !== null && action.count > 0 && (
                        <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">
                            {action.count}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
}
