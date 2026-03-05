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
        <div className="flex h-full flex-col rounded-3xl border border-border bg-background shadow-sm overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
                <div className="flex h-10 items-center gap-1 rounded-xl bg-muted/50 p-1">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${tab === t.key
                                    ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black ${tab === t.key ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"
                                    }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <Link href={viewAllHref} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    View All
                </Link>
            </div>

            {/* Items */}
            <div className="flex-1 divide-y divide-border/50">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                            <span className="text-xl">🎉</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">All caught up!</p>
                        <p className="mt-1 text-xs text-muted-foreground">No pending {tab} to review at the moment.</p>
                    </div>
                ) : (
                    items.slice(0, 5).map(item => (
                        <div key={item.id} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                                    <StatusBadge status={item.status} className="h-4 scale-90 px-1.5 text-[9px]" />
                                </div>
                                {item.owner && <p className="mt-0.5 text-xs font-medium text-muted-foreground/70">{item.owner}</p>}
                                <p className="mt-1 text-[10px] font-medium text-muted-foreground/50 tabular-nums uppercase tracking-tighter">
                                    {format(new Date(item.date), "MMM d, yyyy · HH:mm")}
                                </p>
                            </div>
                            <Link
                                href={item.reviewHref}
                                className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-black text-white shadow-sm shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
                            >
                                Review
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
