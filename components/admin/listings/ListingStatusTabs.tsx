"use client";

import { cn } from "@/lib/utils";

export type ListingStatusTab = "all" | "pending" | "approved" | "rejected" | "draft" | "claimed_pending";

interface ListingStatusTabsProps {
    value: ListingStatusTab;
    counts: Record<ListingStatusTab, number>;
    onChange: (tab: ListingStatusTab) => void;
}

const LABELS: Record<ListingStatusTab, string> = {
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    draft: "Draft",
    claimed_pending: "Claimed Pending",
};

const TABS: ListingStatusTab[] = ["all", "pending", "approved", "rejected", "draft", "claimed_pending"];

export default function ListingStatusTabs({ value, counts, onChange }: ListingStatusTabsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
                const isPendingUrgent = tab === "pending" && (counts.pending ?? 0) > 0;
                const active = value === tab;
                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onChange(tab)}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                            active
                                ? isPendingUrgent
                                    ? "border-orange-500 bg-orange-500 text-white"
                                    : "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>{LABELS[tab]}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/20 text-inherit" : "bg-muted text-foreground")}>
                            {counts[tab] ?? 0}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
