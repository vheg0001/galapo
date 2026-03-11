"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Power, Star, Trash2 } from "lucide-react";
import DataTable, { type Column } from "@/components/admin/shared/DataTable";
import { cn } from "@/lib/utils";

type AdminEventRow = {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time: string | null;
    venue: string | null;
    is_city_wide: boolean;
    is_featured: boolean;
    is_active: boolean;
    listing?: { business_name?: string } | null;
};

export default function AdminEventsTable() {
    const [rows, setRows] = useState<AdminEventRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("all");
    const [status, setStatus] = useState("all");
    const [featured, setFeatured] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [search, setSearch] = useState("");

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (type !== "all") params.set("type", type);
            if (status !== "all") params.set("status", status);
            if (featured !== "all") params.set("featured", featured);
            if (dateFrom) params.set("date_from", dateFrom);
            if (dateTo) params.set("date_to", dateTo);
            if (search) params.set("search", search);

            const response = await fetch(`/api/admin/events?${params.toString()}`);
            const payload = await response.json();
            setRows(payload.data || []);
        } catch (error) {
            console.error("Failed to load admin events", error);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, featured, search, status, type]);

    useEffect(() => {
        loadRows();
    }, [loadRows]);

    const updateEvent = async (id: string, body: Record<string, unknown>) => {
        await fetch(`/api/admin/events/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        loadRows();
    };

    const removeEvent = async (id: string) => {
        if (!window.confirm("Delete this event permanently?")) return;
        await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
        loadRows();
    };

    const bulk = async (action: "activate" | "deactivate" | "delete" | "toggle_featured", selectedRows: AdminEventRow[]) => {
        if (!selectedRows.length) return;
        if (action === "delete" && !window.confirm(`Delete ${selectedRows.length} selected event(s)?`)) return;
        await fetch("/api/admin/events/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, event_ids: selectedRows.map((row) => row.id) }),
        });
        loadRows();
    };

    const columns = useMemo<Column<AdminEventRow>[]>(() => [
        {
            key: "title",
            header: "Title",
            render: (row) => (
                <div className="space-y-1">
                    <p className="font-bold text-foreground">{row.title}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{row.is_city_wide ? "City Event" : "Business Event"}</p>
                </div>
            ),
        },
        {
            key: "event_date",
            header: "Date",
            render: (row) => new Date(`${row.event_date.split("T")[0]}T00:00:00`).toLocaleDateString(),
        },
        {
            key: "time",
            header: "Time",
            render: (row) => `${row.start_time}${row.end_time ? ` - ${row.end_time}` : ""}`,
        },
        {
            key: "venue",
            header: "Venue",
            render: (row) => row.venue || "Olongapo City",
        },
        {
            key: "business",
            header: "Business Name",
            render: (row) => row.listing?.business_name || "—",
        },
        {
            key: "featured",
            header: "Featured",
            render: (row) => (
                <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]", row.is_featured ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground")}>
                    {row.is_featured ? "Yes" : "No"}
                </span>
            ),
        },
        {
            key: "active",
            header: "Active",
            render: (row) => (
                <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]", row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                    {row.is_active ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Link href={`/admin/events/${row.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                    </Link>
                    <button type="button" onClick={() => updateEvent(row.id, { is_featured: !row.is_featured })} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                        <Star className={cn("h-4 w-4", row.is_featured && "fill-current text-secondary")} />
                    </button>
                    <button type="button" onClick={() => updateEvent(row.id, { is_active: !row.is_active })} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground">
                        <Power className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeEvent(row.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ], []);

    return (
        <div className="space-y-6">
            <div className="grid gap-3 rounded-[2rem] border border-border bg-card p-5 shadow-sm lg:grid-cols-[auto_auto_auto_1fr_1fr_1fr]">
                <div className="inline-flex rounded-2xl border border-border bg-background p-1">
                    {[
                        { value: "all", label: "All" },
                        { value: "city", label: "City" },
                        { value: "business", label: "Business" },
                    ].map((option) => (
                        <button key={option.value} type="button" onClick={() => setType(option.value)} className={cn("rounded-xl px-4 py-2 text-sm font-bold", type === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{option.label}</button>
                    ))}
                </div>

                <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm">
                    <option value="all">All statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                </select>

                <select value={featured} onChange={(e) => setFeatured(e.target.value)} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm">
                    <option value="all">Featured: All</option>
                    <option value="true">Featured only</option>
                    <option value="false">Non-featured</option>
                </select>

                <input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} type="date" className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" />
                <input value={dateTo} onChange={(e) => setDateTo(e.target.value)} type="date" className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or business..." className="h-11 rounded-2xl border border-border bg-background px-4 text-sm" />
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-4 shadow-sm">
                <DataTable
                    data={rows}
                    columns={columns}
                    keyField="id"
                    isLoading={loading}
                    searchable={false}
                    defaultPageSize={10}
                    emptyMessage="No events found."
                    bulkActions={[
                        { label: "Activate Selected", onClick: (selected) => bulk("activate", selected) },
                        { label: "Deactivate Selected", onClick: (selected) => bulk("deactivate", selected) },
                        { label: "Toggle Featured", onClick: (selected) => bulk("toggle_featured", selected) },
                        { label: "Delete Selected", onClick: (selected) => bulk("delete", selected), variant: "destructive" },
                    ]}
                />
            </div>
        </div>
    );
}