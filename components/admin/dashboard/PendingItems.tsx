"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import StatusBadge from "@/components/admin/shared/StatusBadge";

interface PendingItem {
    id: string;
    name: string;
    owner?: string;
    date: string;
    status: string;
    reviewHref: string;
}

interface PendingItemsProps {
    listings: PendingItem[];
    payments: PendingItem[];
    claims: PendingItem[];
}

type Tab = "listings" | "payments" | "claims";

export default function PendingItems({ listings, payments, claims }: PendingItemsProps) {
    const [tab, setTab] = useState<Tab>("listings");

    const tabs: { key: Tab; label: string; count: number; href: string }[] = [
        { key: "listings", label: "Listings", count: listings.length, href: "/admin/listings?status=pending" },
        { key: "payments", label: "Payments", count: payments.length, href: "/admin/payments?status=pending" },
        { key: "claims", label: "Claims", count: claims.length, href: "/admin/claims?status=pending" },
    ];

    const items = tab === "listings" ? listings : tab === "payments" ? payments : claims;
    const viewAllHref = tabs.find(t => t.key === tab)!.href;

    return (
        <div className="rounded-2xl border border-border bg-background shadow-sm">
            {/* Tab Bar */}
            <div className="flex border-b border-border">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition ${tab === t.key
                                ? "border-b-2 border-[#FF6B35] text-[#FF6B35]"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${tab === t.key ? "bg-[#FF6B35] text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Items */}
            <div className="divide-y divide-border">
                {items.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        No pending {tab} — all caught up! 🎉
                    </p>
                ) : (
                    items.slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                {item.owner && <p className="text-xs text-muted-foreground">{item.owner}</p>}
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                    {format(new Date(item.date), "MMM d, yyyy HH:mm")}
                                </p>
                            </div>
                            <StatusBadge status={item.status} />
                            <Link
                                href={item.reviewHref}
                                className="shrink-0 rounded-lg bg-[#FF6B35] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e55a24]"
                            >
                                Review
                            </Link>
                        </div>
                    ))
                )}
            </div>

            {/* View All */}
            {items.length > 0 && (
                <div className="border-t border-border px-4 py-3 text-center">
                    <Link href={viewAllHref} className="text-xs font-medium text-[#FF6B35] hover:underline">
                        View all {items.length} pending {tab}
                    </Link>
                </div>
            )}
        </div>
    );
}
