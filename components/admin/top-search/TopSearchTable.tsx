"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { XCircle } from "lucide-react";
import DataTable, { Column } from "@/components/admin/shared/DataTable";
import { cn } from "@/lib/utils";
import { getDaysRemaining } from "@/lib/subscription-helpers";
import { RemovePlacementModal } from "./RemovePlacementModal";

export function TopSearchTable() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/top-search?format=list");
            const json = await res.json();
            setRows(json.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function handleRemoveRequest(placement: any) {
        setSelectedPlacement(placement);
        setModalOpen(true);
    }

    async function handleConfirmRemove(reason: string) {
        if (!selectedPlacement) return;
        console.log("TopSearchTable: handleConfirmRemove", { id: selectedPlacement.id, reason });
        try {
            const res = await fetch(`/api/admin/top-search/${selectedPlacement.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", effective: "immediate", reason })
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                let reason = "Failed to remove placement";
                try {
                    const json = JSON.parse(text);
                    reason = json.error || reason;
                } catch {
                    reason = `Server error (${res.status}): ${text.slice(0, 100)}...`;
                }
                throw new Error(reason);
            }
            setModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error("TopSearchTable Error:", error);
            const debugMsg = `ERROR: ${error.message}\n` + 
                           (error.stack ? `Stack: ${error.stack.split('\n')[0]}\n` : "") +
                           `Please check the browser console for details.`;
            alert(debugMsg);
        }
    }

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: "business_name",
            header: "Business Name",
            render: (r) => (
                <Link href={`/admin/listings/${r.listing_id}`} className="text-blue-600 font-bold hover:underline">
                    {r.business_name}
                </Link>
            )
        },
        {
            key: "category_name",
            header: "Category",
            render: (r) => <span className="font-semibold text-muted-foreground">{r.category_name}</span>
        },
        {
            key: "position",
            header: "Position",
            render: (r) => (
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        {r.position}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Top Slot</span>
                </div>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (r) => {
                const isFuture = new Date(r.start_date) > new Date();
                const isExpired = new Date(r.end_date) < new Date();
                
                let state = "Active";
                let colorClass = "bg-emerald-500";
                
                if (isFuture) { state = "Scheduled"; colorClass = "bg-blue-500"; }
                if (isExpired) { state = "Expired"; colorClass = "bg-gray-400"; }
                if (!r.is_active) { state = "Inactive"; colorClass = "bg-red-500"; }

                return (
                    <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", colorClass)} />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                            {state}
                        </span>
                    </div>
                );
            }
        },
        {
            key: "timeline",
            header: "Timeline",
            render: (r) => {
                const daysLeft = getDaysRemaining(r.end_date);
                const isExpired = new Date(r.end_date) < new Date();

                if (isExpired) return <span className="text-xs font-bold text-muted-foreground">Ended {new Date(r.end_date).toLocaleDateString()}</span>;

                return (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                            Ends {new Date(r.end_date).toLocaleDateString()}
                        </span>
                        <span className={cn("text-[10px] uppercase font-black tracking-widest", daysLeft < 7 ? "text-orange-500" : "text-emerald-600")}>
                            {daysLeft} days left
                        </span>
                    </div>
                );
            }
        },
        {
            key: "actions",
            header: "Actions",
            render: (r) => (
                <button
                    onClick={() => handleRemoveRequest(r)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    title="Remove Placement"
                >
                    <XCircle className="h-4 w-4" />
                </button>
            )
        }
    ], [loadData]);

    return (
        <div className="rounded-[2.5rem] border border-border bg-white shadow-sm overflow-hidden flex flex-col gap-4">
            <DataTable<any>
                data={rows}
                columns={columns}
                keyField="id"
                isLoading={loading}
                emptyMessage="No top search placements found."
                className="p-4"
                persistKey="admin-top-search-table"
            />

            <RemovePlacementModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmRemove}
                businessName={selectedPlacement?.business_name || "Unknown"}
            />
        </div>
    );
}
