"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Star, MoreHorizontal } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import DataTable, { Column } from "@/components/admin/shared/DataTable";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import ListingsFilterBar, { ListingsFiltersValue } from "@/components/admin/listings/ListingsFilterBar";
import RejectionModal from "@/components/admin/listings/RejectionModal";
import ApprovalDialog from "@/components/admin/listings/ApprovalDialog";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import HardDeleteModal from "@/components/admin/shared/HardDeleteModal";

type ListingRow = {
    id: string;
    business_name: string;
    slug: string;
    status: string;
    category_name: string;
    subcategory_name: string | null;
    barangay_name: string;
    owner_name: string | null;
    owner_id: string | null;
    is_pre_populated: boolean;
    is_active: boolean;
    is_featured: boolean;
    plan: string;
    views_this_month?: number;
    views_count?: number;
    created_at: string;
};

const DEFAULT_FILTERS: ListingsFiltersValue = {
    status: "all",
    category_id: "",
    subcategory_id: "",
    barangay_id: "",
    plan: "all",
    owner_type: "all",
    active: "all",
    date_from: "",
    date_to: "",
};

type ListingRowActionsProps = {
    listing: ListingRow;
    onApprove: () => void;
    onReject: () => void;
    onAction: (actionType: string) => void;
    onHardDelete: () => void;
    onCopy: () => void;
    isCopying?: boolean;
};

function ListingRowActions({ listing, onApprove, onReject, onAction, onHardDelete, onCopy, isCopying }: ListingRowActionsProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    useClickOutside(detailsRef, () => {
        if (detailsRef.current) {
            detailsRef.current.open = false;
        }
    });

    return (
        <details ref={detailsRef} data-actions-menu="listing" onClick={(e) => e.stopPropagation()} className="relative group">
            <summary className="cursor-pointer list-none rounded-lg border border-border/50 bg-background/50 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-1 space-y-0.5">
                    <a href={`/listing/${listing.slug}`} target="_blank" rel="noopener noreferrer" className="block rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/80 cursor-pointer">View Public Page</a>
                    <Link href={`/admin/listings/${listing.id}/edit`} className="block rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/80 cursor-pointer">Edit Listing</Link>
                    <button
                        type="button"
                        onClick={onCopy}
                        disabled={isCopying}
                        className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted/80 disabled:opacity-50 cursor-pointer"
                    >
                        {isCopying ? "Copying..." : "Copy Listing"}
                    </button>

                    {listing.status === "pending" && (
                        <>
                            <div className="my-1 h-px bg-border/50" />
                            <button type="button" onClick={onApprove} className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 cursor-pointer">Approve</button>
                            <button type="button" onClick={onReject} className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/10 cursor-pointer">Reject</button>
                        </>
                    )}

                    <div className="my-1 h-px bg-border/50" />

                    <button type="button" onClick={() => onAction("toggle_active")} className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted/80 cursor-pointer">
                        Set {listing.is_active ? "Inactive" : "Active"}
                    </button>

                    {listing.owner_id && (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to reset "${listing.business_name}"? This will remove the owner and notify them.`)) {
                                    onAction("reset_listing");
                                }
                            }}
                            className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/10 cursor-pointer"
                        >
                            Reset Listing
                        </button>
                    )}

                    <div className="my-1 h-px bg-border/50" />

                    {listing.status === "deactivated" ? (
                        <button type="button" onClick={onHardDelete} className="block w-full rounded-md px-3 py-2 text-left text-xs font-bold text-red-600 transition-colors hover:bg-red-500/10 cursor-pointer">
                            Delete Permanent
                        </button>
                    ) : (
                        <button type="button" onClick={() => onAction("delete_soft")} className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 cursor-pointer">
                            Delete (Soft)
                        </button>
                    )}
                </div>
            </div>
        </details>
    );
}

export default function AdminListingsPage() {
    const [rows, setRows] = useState<ListingRow[]>([]);
    const [isCopying, setIsCopying] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [counts, setCounts] = useState<any>({ all: 0, pending: 0, approved: 0, rejected: 0, draft: 0, claimed_pending: 0, deactivated: 0, total: 0, active: 0, inactive: 0 });
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<ListingsFiltersValue>(DEFAULT_FILTERS);
    const [loading, setLoading] = useState(true);
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [bulkRejectTargets, setBulkRejectTargets] = useState<ListingRow[]>([]);
    const [approveTarget, setApproveTarget] = useState<string | null>(null);
    const [hardDeleteTarget, setHardDeleteTarget] = useState<ListingRow | null>(null);
    const [hardDeleteLoading, setHardDeleteLoading] = useState(false);

    async function loadMeta() {
        const [catRes, brgyRes] = await Promise.all([
            fetch("/api/categories?all=true", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
            fetch("/api/barangays?all=true", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
        ]);

        const rawCategories = catRes.data ?? catRes.categories ?? [];
        const hasNestedSubcategories = rawCategories.some((c: any) => Array.isArray(c?.subcategories));
        const cats = rawCategories.filter((c: any) => !c.parent_id);
        const subs = hasNestedSubcategories
            ? rawCategories.flatMap((parent: any) =>
                (parent.subcategories ?? []).map((sub: any) => ({
                    ...sub,
                    parent_id: sub.parent_id ?? parent.id,
                }))
            )
            : rawCategories.filter((c: any) => !!c.parent_id);
        setCategories(cats);
        setSubcategories(subs);
        setBarangays(brgyRes.data ?? brgyRes.barangays ?? []);
    }

    async function loadRows() {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v) params.set(k, String(v));
        });
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/listings?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
            console.error("[loadRows] API error:", res.status, await res.text());
            setLoading(false);
            return;
        }
        const json = await res.json();
        console.log("[loadRows] got", json.data?.length, "rows, total:", json.total);
        setRows(json.data ?? []);
        setTotal(json.total ?? 0);
        setCounts((prev: any) => {
            const next = { ...prev, ...(json.counts ?? {}) };
            next.all = next.total ?? next.all ?? 0;
            if (next.total == null) next.total = next.all;
            return next;
        });
        setLoading(false);
    }

    useEffect(() => {
        loadMeta();
    }, []);

    useEffect(() => {
        loadRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, search]);

    async function patchListing(id: string, action: string, reason?: string) {
        if (action === "delete_soft") {
            await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
        } else {
            await fetch(`/api/admin/listings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, reason }),
            });
        }
        await loadRows();
    }

    async function hardDeleteListing(id: string) {
        setHardDeleteLoading(true);
        try {
            const res = await fetch(`/api/admin/listings/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hard: true, confirmation: "DELETE" }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to delete listing permanently.");
            }
        } catch (error) {
            console.error("Hard delete failed:", error);
        } finally {
            setHardDeleteLoading(false);
            setHardDeleteTarget(null);
            await loadRows();
        }
    }

    async function copyListing(listing: ListingRow) {
        if (!window.confirm(`Are you sure you want to duplicate "${listing.business_name}"?`)) return;
        setIsCopying(listing.id);

        try {
            // 1. Fetch full details
            const detailRes = await fetch(`/api/admin/listings/${listing.id}`);
            const detailJson = await detailRes.json();
            if (!detailRes.ok) throw new Error(detailJson.error || "Failed to fetch listing details");

            const original = detailJson.listing;
            const originalImages = detailJson.images ?? [];
            const originalFields = detailJson.dynamic_field_values ?? [];

            // 2. Prepare payload
            const images = originalImages.map((img: any) => img.image_url).filter(Boolean);
            const dynamicFields = originalFields.reduce((acc: Record<string, any>, row: any) => {
                if (row.field_id) acc[row.field_id] = row.value;
                return acc;
            }, {});

            const payload = {
                business_name: `${original.business_name} (Copy)`,
                category_id: original.category_id,
                subcategory_id: original.subcategory_id,
                barangay_id: original.barangay_id,
                address: original.address,
                lat: original.lat,
                lng: original.lng,
                phone: original.phone,
                phone_secondary: original.phone_secondary,
                email: original.email,
                website: original.website,
                social_links: original.social_links ?? {},
                operating_hours: original.operating_hours ?? {},
                short_description: original.short_description,
                full_description: original.full_description,
                tags: original.tags ?? [],
                payment_methods: original.payment_methods ?? [],
                logo_url: original.logo_url,
                image_urls: images,
                dynamic_fields: dynamicFields,
                // Critical overrides for the request
                owner_id: null,
                is_active: false,
                status: "approved",
            };

            // 3. Create the copy
            const createRes = await fetch("/api/admin/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const createJson = await createRes.json();
            if (!createRes.ok) throw new Error(createJson.error || "Failed to create duplicated listing");

            alert("Listing duplicated successfully as an inactive, pre-populated listing.");
            await loadRows();
        } catch (error: any) {
            console.error("Copy failed:", error);
            alert(`Duplicate failed: ${error.message}`);
        } finally {
            setIsCopying(null);
        }
    }

    async function bulk(action: string, selectedRows: ListingRow[], reason?: string) {
        await fetch("/api/admin/listings/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, listing_ids: selectedRows.map((r) => r.id), reason }),
        });
        await loadRows();
    }

    const columns = useMemo<Column<ListingRow>[]>(() => [
        {
            key: "id",
            header: "ID",
            render: (r) => (
                <button
                    type="button"
                    className="font-mono text-xs text-blue-600 underline cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(r.id);
                    }}
                >
                    {r.id.slice(0, 8)}
                </button>
            ),
        },
        {
            key: "business_name",
            header: "Business Name",
            sortable: true,
            render: (r) => (
                <Link href={`/admin/listings/${r.id}`} className="font-medium text-foreground hover:text-[#FF6B35]">
                    {r.business_name}
                </Link>
            ),
        },
        { key: "category_name", header: "Category", sortable: true, render: (r) => `${r.category_name}${r.subcategory_name ? ` / ${r.subcategory_name}` : ""}` },
        { key: "barangay_name", header: "Barangay", render: (r) => r.barangay_name },
        { key: "owner_name", header: "Owner", render: (r) => r.owner_name ?? "Pre-populated" },
        { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
        {
            key: "plan",
            header: "Plan",
            render: (r) => {
                const plan = r.plan === "premium" ? "premium" : r.plan === "featured" ? "featured" : "free";
                const classes = plan === "premium"
                    ? "bg-violet-500/10 text-violet-600 border border-violet-500/20"
                    : plan === "featured"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-muted/50 text-muted-foreground border border-border/50";
                return (
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${classes}`}>
                        {plan}
                    </span>
                );
            },
        },
        {
            key: "is_active",
            header: "Active",
            render: (r) => (
                <div className="flex items-center justify-center">
                    <span className={`inline-block h-3 w-3 rounded-full shadow-inner ${r.is_active ? "bg-emerald-500 shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50"}`} />
                </div>
            ),
        },
        {
            key: "is_featured",
            header: "Featured",
            render: (r) => (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); patchListing(r.id, "toggle_featured"); }}
                    className={`transition-transform hover:scale-110 active:scale-95 cursor-pointer ${r.is_featured ? "text-amber-500" : "text-muted-foreground/30 hover:text-amber-500/50"}`}
                >
                    <Star className={`h-5 w-5 ${r.is_featured ? "fill-amber-500" : ""}`} />
                </button>
            ),
        },
        {
            key: "views_this_month",
            header: "Views",
            sortable: true,
            render: (r) => {
                const views = r.views_this_month ?? r.views_count ?? 0;
                return views.toLocaleString();
            },
        },
        { key: "created_at", header: "Created", sortable: true, render: (r) => new Date(r.created_at).toLocaleDateString() },
        {
            key: "actions",
            header: "Actions",
            render: (r) => (
                <ListingRowActions
                    listing={r}
                    onApprove={() => setApproveTarget(r.id)}
                    onReject={() => setRejectTarget(r.id)}
                    onAction={(type) => patchListing(r.id, type as any)}
                    onHardDelete={() => setHardDeleteTarget(r)}
                    onCopy={() => copyListing(r)}
                    isCopying={isCopying === r.id}
                />
            ),
        },
    ], []);

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Listings Management"
                breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Listings" }]}
                actions={
                    <>
                        <Link href="/admin/listings/new" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Add Listing</Link>
                        <button type="button" className="rounded-md border border-border px-3 py-2 text-xs font-semibold">Import CSV</button>
                        <button type="button" className="rounded-md border border-border px-3 py-2 text-xs font-semibold">Export CSV</button>
                    </>
                }
            />

            <ListingsFilterBar
                filters={filters}
                counts={counts}
                categories={categories}
                subcategories={subcategories}
                barangays={barangays}
                search={search}
                onSearchChange={setSearch}
                onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
                onClear={() => {
                    setFilters(DEFAULT_FILTERS);
                    setSearch("");
                }}
            />

            <DataTable<ListingRow>
                data={rows}
                columns={columns}
                keyField="id"
                searchable={false}
                isLoading={loading}
                defaultPageSize={20}
                pageSizeOptions={[20, 50, 100]}
                emptyMessage="No listings found."
                onRowClick={(r) => (window.location.href = `/admin/listings/${r.id}`)}
                bulkActions={[
                    { label: "Approve Selected", onClick: (selected) => bulk("approve", selected) },
                    {
                        label: "Reject Selected",
                        onClick: (selected) => {
                            if (!selected.length) return;
                            setBulkRejectTargets(selected);
                        },
                        variant: "destructive",
                    },
                    { label: "Activate Selected", onClick: (selected) => bulk("activate", selected) },
                    { label: "Deactivate Selected", onClick: (selected) => bulk("deactivate", selected) },
                    { label: "Delete Selected", onClick: (selected) => bulk("delete", selected), variant: "destructive" },
                ]}
                className="rounded-2xl border border-border bg-background p-4"
            />

            <p className="text-xs text-muted-foreground">Showing 1-{Math.min(rows.length, 20)} of {total} listings</p>

            <ApprovalDialog
                open={!!approveTarget}
                onClose={() => setApproveTarget(null)}
                onConfirm={async () => {
                    if (!approveTarget) return;
                    await patchListing(approveTarget, "approve");
                    setApproveTarget(null);
                }}
            />

            <RejectionModal
                open={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                onSubmit={async (reason) => {
                    if (!rejectTarget) return;
                    await patchListing(rejectTarget, "reject", reason);
                    setRejectTarget(null);
                }}
            />

            <RejectionModal
                open={bulkRejectTargets.length > 0}
                title={`Reject ${bulkRejectTargets.length} Selected Listing${bulkRejectTargets.length === 1 ? "" : "s"}`}
                onClose={() => setBulkRejectTargets([])}
                onSubmit={async (reason) => {
                    if (!bulkRejectTargets.length) return;
                    await bulk("reject", bulkRejectTargets, reason);
                    setBulkRejectTargets([]);
                }}
            />

            <HardDeleteModal
                open={!!hardDeleteTarget}
                title="Delete Listing Permanently"
                itemName={hardDeleteTarget?.business_name}
                loading={hardDeleteLoading}
                onClose={() => setHardDeleteTarget(null)}
                onConfirm={() => {
                    if (hardDeleteTarget) hardDeleteListing(hardDeleteTarget.id);
                }}
            />
        </div >
    );
}
