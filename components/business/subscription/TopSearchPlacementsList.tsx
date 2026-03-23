"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import type { SubscriptionListItem } from "@/lib/types";

type TopSearchPlacementRow = SubscriptionListItem["top_search_placements"][number] & {
    listing_id: string;
    listing_name: string;
};

interface TopSearchPlacementsListProps {
    items: SubscriptionListItem[];
}

function buildPlacementRows(items: SubscriptionListItem[]): TopSearchPlacementRow[] {
    return items.flatMap((item) =>
        item.top_search_placements.map((placement) => ({
            ...placement,
            listing_id: item.listing_id,
            listing_name: item.listing_name,
        }))
    );
}

export default function TopSearchPlacementsList({ items }: TopSearchPlacementsListProps) {
    const [placements, setPlacements] = useState<TopSearchPlacementRow[]>(() => buildPlacementRows(items));
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (placement: TopSearchPlacementRow) => {
        const confirmed = window.confirm(
            `Delete the pending placement request for ${placement.listing_name} in ${placement.category_name}?`
        );

        if (!confirmed) return;

        setDeletingId(placement.id);

        try {
            const response = await fetch(`/api/business/top-search/${placement.id}`, {
                method: "DELETE",
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to delete placement request.");
            }

            setPlacements((current) => current.filter((item) => item.id !== placement.id));
        } catch (error: any) {
            console.error("Failed to delete placement request:", error);
            window.alert(error.message || "Failed to delete placement request.");
        } finally {
            setDeletingId(null);
        }
    };

    if (placements.length === 0) {
        return (
            <div className="col-span-full flex h-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No active placements</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">Boost your listing by appearing at the top of search results.</p>
            </div>
        );
    }

    return (
        <>
            {placements.map((placement) => (
                <div key={placement.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600">
                                #{placement.position}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{placement.category_name}</p>
                                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">{placement.listing_name}</p>
                            </div>
                        </div>

                        {placement.status === "active" ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">Active</span>
                        ) : placement.status === "under_review" ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">Under Review</span>
                        ) : placement.status === "pending_payment" ? (
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700">Pending</span>
                                <Link
                                    href={`/business/subscription/top-search/purchase?listing=${placement.listing_id}&category=${placement.category_id}&position=${placement.position}&resume=1`}
                                    className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase text-white transition-colors hover:bg-slate-800"
                                >
                                    Review
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(placement)}
                                    disabled={deletingId === placement.id}
                                    className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Delete pending placement"
                                    aria-label={`Delete pending placement for ${placement.listing_name}`}
                                >
                                    {deletingId === placement.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <X className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">Expired</span>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}
