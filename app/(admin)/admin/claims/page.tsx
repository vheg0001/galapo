"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import DataTable, { Column } from "@/components/admin/shared/DataTable";
import StatusBadge from "@/components/admin/shared/StatusBadge";

type ClaimRow = {
    id: string;
    notification_id?: string;
    listing_name: string;
    status: string;
    claimed_at: string | null;
    claimant: { full_name?: string; email?: string } | null;
};

const TABS = ["pending", "approved", "rejected"] as const;
type ClaimTab = (typeof TABS)[number];

export default function AdminClaimsPage() {
    const router = useRouter();
    const [status, setStatus] = useState<ClaimTab>("pending");
    const [rows, setRows] = useState<ClaimRow[]>([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        const res = await fetch(`/api/admin/claims?status=${status}`, { cache: "no-store" });
        const json = await res.json();
        setRows(json.claims ?? []);
        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    async function handleDelete(claim: ClaimRow) {
        const confirmMsg = claim.status === "rejected"
            ? "Are you sure you want to delete this historical record?"
            : "Are you sure you want to delete this claim request and reset the listing?";

        if (!confirm(confirmMsg)) return;

        try {
            const url = claim.notification_id
                ? `/api/admin/claims/${claim.id}?notification_id=${claim.notification_id}`
                : `/api/admin/claims/${claim.id}`;

            const res = await fetch(url, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to delete");

            // Refresh rows
            load();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const columns = useMemo<Column<ClaimRow>[]>(() => [
        { key: "listing_name", header: "Listing Name", render: (r) => r.listing_name },
        { key: "claimant_name", header: "Claimant Name", render: (r) => r.claimant?.full_name ?? "N/A" },
        { key: "claimant_email", header: "Claimant Email", render: (r) => r.claimant?.email ?? "N/A" },
        { key: "claimed_at", header: "Submitted Date", render: (r) => r.claimed_at ? new Date(r.claimed_at).toLocaleDateString() : "N/A" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        {
            key: "actions",
            header: "Actions",
            render: (r) => (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/claims/${r.id}`); }}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all hover:bg-muted hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        Open
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                        className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-[11px] font-bold text-red-600 shadow-sm transition-all hover:bg-red-500 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ], [router]);

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Claim Requests"
                breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Claims" }]}
            />

            <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setStatus(tab)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status === tab ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <DataTable<ClaimRow>
                data={rows}
                columns={columns}
                keyField="id"
                isLoading={loading}
                searchable
                searchPlaceholder="Search claims..."
                defaultPageSize={20}
                pageSizeOptions={[20, 50, 100]}
                emptyMessage="No claim requests found."
                onRowClick={(row) => router.push(`/admin/claims/${row.id}`)}
            />
        </div>
    );
}
