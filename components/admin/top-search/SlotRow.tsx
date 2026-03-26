"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDaysRemaining } from "@/lib/subscription-helpers";
import { AssignPlacementModal } from "./AssignPlacementModal";
import { RemovePlacementModal } from "./RemovePlacementModal";

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

    async function handleConfirmRemove(reason: string) {
        setRemoving(true);
        console.log("SlotRow: handleConfirmRemove", { id: placement.id, reason });
        try {
            const res = await fetch(`/api/admin/top-search/${placement.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", effective: "immediate", reason })
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                let reasonMsg = "Failed to remove placement";
                try {
                    const json = JSON.parse(text);
                    reasonMsg = json.error || reasonMsg;
                } catch {
                    reasonMsg = `Server error (${res.status}): ${text.slice(0, 100)}...`;
                }
                throw new Error(reasonMsg);
            }
            onUpdated();
        } catch (error: any) {
            console.error("SlotRow Error:", error);
            const debugMsg = `ERROR: ${error.message}\n` + 
                           (error.stack ? `Stack: ${error.stack.split('\n')[0]}\n` : "") +
                           `Please check the browser console for details.`;
            alert(debugMsg);
        } finally {
            setRemoving(false);
            setModalOpen(false);
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
                onClick={() => setModalOpen(true)}
                disabled={removing}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                title="Remove Placement"
            >
                <XCircle className="h-4 w-4" />
            </button>

            <RemovePlacementModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmRemove}
                businessName={placement.listings?.business_name || "Unknown"}
            />
        </div>
    );
}
