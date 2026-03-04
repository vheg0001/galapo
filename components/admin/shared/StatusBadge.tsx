"use client";

import { cn } from "@/lib/utils";

const CONFIG: Record<string, { label: string; className: string }> = {
    // Listing statuses
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
    approved: { label: "Approved", className: "bg-green-100  text-green-800  border border-green-200" },
    rejected: { label: "Rejected", className: "bg-red-100    text-red-800    border border-red-200" },
    claimed_pending: { label: "Claim Pending", className: "bg-orange-100 text-orange-800 border border-orange-200" },
    draft: { label: "Draft", className: "bg-gray-100   text-gray-600   border border-gray-200" },
    // Payment statuses
    verified: { label: "Verified", className: "bg-green-100  text-green-800  border border-green-200" },
    // Subscription statuses
    active: { label: "Active", className: "bg-green-100  text-green-800  border border-green-200" },
    expired: { label: "Expired", className: "bg-gray-100   text-gray-600   border border-gray-200" },
    pending_payment: { label: "Pending Payment", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
    cancelled: { label: "Cancelled", className: "bg-red-100    text-red-800    border border-red-200" },
    // Annual checks
    confirmed: { label: "Confirmed", className: "bg-green-100  text-green-800  border border-green-200" },
    no_response: { label: "No Response", className: "bg-red-100    text-red-800    border border-red-200" },
    deactivated: { label: "Deactivated", className: "bg-gray-100   text-gray-600   border border-gray-200" },
    // Boolean
    true: { label: "Yes", className: "bg-green-100  text-green-800  border border-green-200" },
    false: { label: "No", className: "bg-gray-100   text-gray-600   border border-gray-200" },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const cfg = CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border border-gray-200" };
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
            cfg.className, className
        )}>
            {cfg.label}
        </span>
    );
}
