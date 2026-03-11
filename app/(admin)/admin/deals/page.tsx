"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Power, Trash2, Pencil } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import DataTable, { Column } from "@/components/admin/shared/DataTable";
import { cn } from "@/lib/utils";

type DealRow = {
    id: string;
    title: string;
    discount_text: string;
    is_active: boolean;
    created_at: string;
    business_name: string;
    owner_name: string | null;
    owner_email: string | null;
    listing_id: string;
    start_date: string;
    end_date: string;
};

export default function AdminDealsPage() {
    const [rows, setRows] = useState<DealRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);

    const loadRows = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);

        try {
            const res = await fetch(`/api/admin/deals?${params.toString()}`);
            const json = await res.json();
            setRows(json.data || []);
            setTotal(json.total || 0);
        } catch (err) {
            console.error("Failed to load deals", err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        loadRows();
    }, [loadRows]);

    const toggleActive = useCallback(async (id: string, current: boolean) => {
        await fetch(`/api/admin/deals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !current })
        });
        loadRows();
    }, [loadRows]);

    const deleteDeal = useCallback(async (id: string) => {
        if (!confirm("Are you sure you want to delete this deal?")) return;
        await fetch(`/api/admin/deals/${id}`, { method: "DELETE" });
        loadRows();
    }, [loadRows]);

    async function bulk(action: "deactivate" | "delete", selectedRows: DealRow[]) {
        if (!selectedRows.length) return;

        if (action === "delete") {
            const confirmed = window.confirm(
                `Are you sure you want to delete ${selectedRows.length} selected deal${selectedRows.length === 1 ? "" : "s"}?`
            );

            if (!confirmed) return;
        }

        try {
            const res = await fetch("/api/admin/deals/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    deal_ids: selectedRows.map((row) => row.id),
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `Failed to ${action} selected deals.`);
            }

            await loadRows();
        } catch (error) {
            console.error(`Failed to ${action} deals`, error);
            alert(action === "delete" ? "Failed to delete selected deals." : "Failed to deactivate selected deals.");
        }
    }

    const columns = useMemo<Column<DealRow>[]>(() => [
        {
            key: "title",
            header: "Deal Title",
            render: (r) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{r.title}</span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-tight">{r.discount_text}</span>
                </div>
            )
        },
        {
            key: "business_name",
            header: "Business",
            render: (r) => (
                <Link href={`/admin/listings/${r.listing_id}`} className="text-blue-600 hover:underline font-medium">
                    {r.business_name}
                </Link>
            )
        },
        {
            key: "owner",
            header: "Owner",
            render: (r) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold">{r.owner_name || "N/A"}</span>
                    <span className="text-[10px] text-muted-foreground">{r.owner_email || "No Email"}</span>
                </div>
            )
        },
        {
            key: "is_active",
            header: "Status",
            render: (r) => (
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "h-2 w-2 rounded-full",
                        r.is_active ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {r.is_active ? "Live" : "Inactive"}
                    </span>
                </div>
            )
        },
        {
            key: "start_date",
            header: "Goes Live",
            render: (r) => {
                if (!r.start_date) return (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase italic pb-1">N/A</span>
                );

                const start = new Date(r.start_date);
                if (isNaN(start.getTime())) return (
                    <span className="text-[10px] font-bold text-red-400 uppercase italic pb-1">Invalid</span>
                );

                const isFuture = start > new Date();
                return (
                    <div className="flex flex-col">
                        <span className={cn("text-xs font-bold", isFuture ? "text-amber-600" : "text-emerald-600")}>
                            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {isFuture && (
                            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 animate-pulse">
                                Scheduled
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "end_date",
            header: "Expires On",
            render: (r) => {
                if (!r.end_date) return (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase italic pb-1">N/A</span>
                );

                const end = new Date(r.end_date);
                if (isNaN(end.getTime())) return (
                    <span className="text-[10px] font-bold text-red-400 uppercase italic pb-1">Invalid</span>
                );

                const isToday = end.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
                const isExpired = end < new Date() && !isToday;

                return (
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-xs font-bold",
                            isExpired ? "text-red-500" : isToday ? "text-amber-600" : "text-gray-600"
                        )}>
                            {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {isToday && (
                            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 animate-pulse">
                                Expiring Today
                            </span>
                        )}
                        {isExpired && (
                            <span className="text-[10px] uppercase font-black tracking-widest text-red-400">
                                Expired
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "created_at",
            header: "Date Added",
            render: (r) => new Date(r.created_at).toLocaleDateString()
        },
        {
            key: "actions",
            header: "Actions",
            render: (r) => (
                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/deals/${r.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                        title="Edit Deal"
                    >
                        <Pencil size={14} />
                    </Link>
                    <button
                        onClick={() => toggleActive(r.id, r.is_active)}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                            r.is_active ? "text-amber-600 border-amber-100 bg-amber-50" : "text-emerald-600 border-emerald-100 bg-emerald-50"
                        )}
                        title={r.is_active ? "Deactivate" : "Activate"}
                    >
                        <Power size={14} />
                    </button>
                    <button
                        onClick={() => deleteDeal(r.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ], [deleteDeal, toggleActive]);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Deals & Offers Management"
                breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Deals & Offers" }]}
                actions={
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/deals/new"
                            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                        >
                            <span className="text-sm font-bold">+</span>
                            Add Deal
                        </Link>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search deals..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-64 rounded-xl border border-border bg-background px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                }
            />

            <div className="rounded-[2.5rem] border border-border bg-white shadow-sm overflow-hidden">
                <DataTable<DealRow>
                    data={rows}
                    columns={columns}
                    keyField="id"
                    isLoading={loading}
                    bulkActions={[
                        { label: "Deactivate Selected", onClick: (selected) => bulk("deactivate", selected) },
                        { label: "Delete Selected", onClick: (selected) => bulk("delete", selected), variant: "destructive" },
                    ]}
                    emptyMessage="No deals or offers found in the system."
                    className="p-4"
                />
            </div>

            <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Showing {rows.length} of {total} total offers
            </p>
        </div>
    );
}
