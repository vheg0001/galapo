"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDaysRemaining } from "@/lib/subscription-helpers";
import { AssignPlacementModal } from "./AssignPlacementModal";

export function SlotRow({
    categoryId,
    categoryName,
    slot,
    onUpdated
}: {
    categoryId: string;
    categoryName: string;
    slot: any;
    onUpdated: () => void;
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [removing, setRemoving] = useState(false);

    const { is_available, placement, position } = slot;

    async function handleRemove() {
        if (!confirm("Are you sure you want to remove this top search placement?")) return;
        setRemoving(true);
        try {
            // we will create DELETE endpoint at /api/admin/top-search/[id]
            const res = await fetch(`/api/admin/top-search/${placement.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove placement");
            onUpdated();
        } catch (error) {
            console.error(error);
            alert("Failed to remove placement.");
        } finally {
            setRemoving(false);
        }
    }

    if (is_available) {
        return (
            <>
                <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {position}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground italic">Slot Available</span>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex h-8 items-center gap-2 rounded-lg bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Assign
                    </button>
                </div>
                
                <AssignPlacementModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={onUpdated}
                    categoryId={categoryId}
                    categoryName={categoryName}
                    position={position}
                />
            </>
        );
    }

    // Active Placement
    const daysLeft = placement?.end_date ? getDaysRemaining(placement.end_date) : 0;

    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 shadow-inner">
                    {position}
                </div>
                <div className="flex flex-col">
                    <Link href={`/admin/listings/${placement.listing_id}`} className="text-sm font-bold text-foreground hover:text-blue-600 hover:underline">
                        {placement.listings?.business_name || "Unknown"}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                        <span className={cn(daysLeft < 7 ? "text-orange-600" : "text-emerald-600")}>
                            {daysLeft} Days Left
                        </span>
                        <span>•</span>
                        <span>Ends {placement?.end_date ? new Date(placement.end_date).toLocaleDateString() : "N/A"}</span>
                    </div>
                </div>
            </div>
            
            <button
                onClick={handleRemove}
                disabled={removing}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                title="Remove Placement"
            >
                <XCircle className="h-4 w-4" />
            </button>
        </div>
    );
}
