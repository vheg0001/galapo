"use client";

import { cn } from "@/lib/utils";

const CONFIG: Record<string, { label: string; className: string }> = {
    // Listing statuses
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    rejected: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    claimed_pending: { label: "Claim Pending", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    draft: { label: "Draft", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },

    // Payment/Subscription statuses
    verified: { label: "Verified", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    expired: { label: "Expired", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    pending_payment: { label: "Pending Payment", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-600 border-red-500/20" },

    // Annual checks
    confirmed: { label: "Confirmed", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    no_response: { label: "No Response", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    deactivated: { label: "Deactivated", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },

    // Boolean
    true: { label: "Yes", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    false: { label: "No", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const cfg = CONFIG[status] ?? { label: status, className: "bg-slate-500/10 text-slate-600 border-slate-500/20" };

    return (
        <span className={cn(
            "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-[2px]",
            cfg.className,
            className
        )}>
            {cfg.label}
        </span>
    );
}
