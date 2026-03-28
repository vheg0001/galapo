"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, ExternalLink, CalendarDays, ShieldAlert, XCircle, RotateCw } from "lucide-react";
import DataTable, { Column } from "@/components/admin/shared/DataTable";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import { formatPeso, getDaysRemaining, getPlanChangeDirection } from "@/lib/subscription-helpers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExtendDialog } from "./ExtendDialog";
import { UpgradeDialog } from "./UpgradeDialog";

export type SubscriptionRow = {
    id: string;
    listing_id: string;
    business_name: string;
    owner_name: string | null;
    owner_email: string | null;
    plan_type: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    amount: number;
    auto_renew: boolean;
    payment_status: string;
    created_at: string;
};

const TABS = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Pending Payment", value: "pending_payment" },
    { label: "Expiring Soon", value: "expiring_soon" },
    { label: "Expired", value: "expired" },
    { label: "Cancelled", value: "cancelled" }
];

export function SubscriptionsTable({
    onDataChanged,
}: {
    onDataChanged?: () => void;
}) {
    const [rows, setRows] = useState<SubscriptionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [total, setTotal] = useState(0);
    
    // Extend Dialog State
    const [extendDialogOpen, setExtendDialogOpen] = useState(false);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    const [selectedUpgradeRow, setSelectedUpgradeRow] = useState<SubscriptionRow | null>(null);

    const loadRows = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (activeTab !== "all") params.set("status", activeTab);

        try {
            const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
            const json = await res.json();
            setRows(json.data || []);
            setTotal(json.total || json.count || 0);
        } catch (err) {
            console.error("Failed to load subscriptions", err);
        } finally {
            setLoading(false);
        }
    }, [search, activeTab]);

    useEffect(() => {
        loadRows();
    }, [loadRows]);

    async function bulk(action: "remind" | "extend" | "cancel", selectedRows: SubscriptionRow[]) {
        if (!selectedRows.length) return;
        
        let confirmMessage = "";
        if (action === "remind") confirmMessage = `Send renewal reminders to ${selectedRows.length} subscriptions?`;
        if (action === "extend") confirmMessage = `Are you sure you want to extend ${selectedRows.length} subscriptions by 30 days?`;
        if (action === "cancel") confirmMessage = `Are you sure you want to immediately cancel ${selectedRows.length} subscriptions?`;

        if (confirmMessage && !window.confirm(confirmMessage)) return;

        try {
            const res = await fetch("/api/admin/subscriptions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    subscription_ids: selectedRows.map((row) => row.id),
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `Failed to ${action} selected subscriptions.`);
            }

            await loadRows();
            onDataChanged?.();
        } catch (error) {
            console.error(`Failed to ${action} subscriptions`, error);
            alert(`Failed to ${action} selected subscriptions.`);
        }
    }

    const columns = useMemo<Column<SubscriptionRow>[]>(() => [
        {
            key: "business_name",
            header: "Business Name",
            render: (r) => (
                <Link href={`/admin/subscriptions/${r.id}`} className="text-blue-600 font-bold hover:underline truncate max-w-[200px] block">
                    {r.business_name}
                </Link>
            )
        },
        {
            key: "owner_name",
            header: "Owner",
            render: (r) => (
                <div className="flex flex-col max-w-[150px]">
                    <span className="text-xs font-bold truncate">{r.owner_name || "N/A"}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{r.owner_email || "No Email"}</span>
                </div>
            )
        },
        {
            key: "plan_type",
            header: "Plan",
            render: (r) => {
                const plan = r.plan_type?.toLowerCase();
                if (plan === "premium") return <Badge variant="premium">Premium</Badge>;
                if (plan === "featured") return <Badge variant="featured">Featured</Badge>;
                return <Badge variant="default">Free</Badge>;
            },
        },
        {
            key: "status",
            header: "Status",
            render: (r) => (
                <StatusBadge 
                    status={r.status} 
                />
            )
        },
        {
            key: "end_date",
            header: "Timeline",
            render: (r) => {
                if (!r.end_date) return <span className="text-[10px] font-bold text-muted-foreground uppercase italic pb-1">N/A</span>;

                const daysRemaining = getDaysRemaining(r.end_date);
                const isExpired = new Date(r.end_date) < new Date();

                return (
                    <div className="flex flex-col min-w-[120px]">
                        <span className={cn(
                            "text-xs font-bold",
                            isExpired ? "text-red-500" : daysRemaining < 7 ? "text-orange-500" : "text-gray-600"
                        )}>
                            {new Date(r.end_date).toLocaleDateString()}
                        </span>
                        {!isExpired && (
                            <span className={cn(
                                "text-[10px] uppercase font-black tracking-widest",
                                daysRemaining < 7 ? "text-orange-500 animate-pulse" : "text-muted-foreground"
                            )}>
                                {daysRemaining} days left
                            </span>
                        )}
                        {isExpired && (
                            <span className="text-[10px] uppercase font-black tracking-widest text-red-500">
                                Expired
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "amount",
            header: "Amount",
            render: (r) => <span className="font-semibold">{formatPeso(r.amount)}</span>
        },
        {
            key: "payment_status",
            header: "Payment",
            render: (r) => {
                return (
                    <div className="flex items-center gap-1.5 min-w-[90px]">
                        <span className={cn(
                            "h-2 w-2 rounded-full",
                            r.payment_status === "verified" || r.payment_status === "paid" ? "bg-emerald-500" :
                            r.payment_status === "pending" ? "bg-amber-500 animate-pulse" : "bg-gray-300"
                        )} />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            {r.payment_status || "None"}
                        </span>
                    </div>
                );
            }
        },
        {
            key: "actions",
            header: "Actions",
            render: (r) => {
                const planActionLabel =
                    getPlanChangeDirection(r.plan_type, r.plan_type === "premium" ? "featured" : "premium") === "downgrade"
                        ? "Downgrade Plan"
                        : "Upgrade Plan";

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/50 transition-colors hover:bg-muted outline-none">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/subscriptions/${r.id}`} className="cursor-pointer text-xs font-bold w-full text-foreground/80">
                                    <FileText className="mr-2 h-3.5 w-3.5" /> View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/listings/${r.listing_id}`} className="cursor-pointer text-xs font-bold w-full text-foreground/80">
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Listing
                                </Link>
                            </DropdownMenuItem>

                            <div className="my-1 h-px bg-border/50" />

                            <DropdownMenuItem
                                onSelect={() => {
                                    setSelectedUpgradeRow(r);
                                    setUpgradeDialogOpen(true);
                                }}
                                className="cursor-pointer text-xs font-bold text-violet-600 focus:text-violet-700"
                            >
                                <RotateCw className="mr-2 h-3.5 w-3.5" /> {planActionLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => {
                                    setSelectedSubId(r.id);
                                    setExtendDialogOpen(true);
                                }}
                                className="cursor-pointer text-xs font-bold text-emerald-600 focus:text-emerald-700"
                            >
                                <CalendarDays className="mr-2 h-3.5 w-3.5" /> Extend Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => bulk("remind", [r])} className="cursor-pointer text-xs font-bold text-blue-600 focus:text-blue-700">
                                <ShieldAlert className="mr-2 h-3.5 w-3.5" /> Send Reminder
                            </DropdownMenuItem>

                            <div className="my-1 h-px bg-border/50" />

                            <DropdownMenuItem onSelect={() => bulk("cancel", [r])} className="cursor-pointer text-xs font-bold text-red-600 focus:text-red-700">
                                <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel Subscription
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        }
    ], []);

    const FilterTabs = (
        <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 border border-border/50 hidden md:flex">
            {TABS.map(tab => (
                <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                        "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                        activeTab === tab.value
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="rounded-[2.5rem] border border-border bg-white shadow-sm overflow-hidden flex flex-col gap-4">
            <DataTable<SubscriptionRow>
                data={rows}
                columns={columns}
                keyField="id"
                isLoading={loading}
                filterComponent={FilterTabs}
                bulkActions={[
                    { label: "Remind Selected", onClick: (selected) => bulk("remind", selected) },
                    { label: "Extend Selected 30d", onClick: (selected) => bulk("extend", selected) },
                    { label: "Cancel Selected", onClick: (selected) => bulk("cancel", selected), variant: "destructive" },
                ]}
                emptyMessage="No subscriptions found matching the active filters."
                className="p-4"
                persistKey="admin-subscriptions"
            />

            {selectedSubId && (
                <ExtendDialog
                    subscriptionId={selectedSubId}
                    isOpen={extendDialogOpen}
                    onClose={() => {
                        setExtendDialogOpen(false);
                        setSelectedSubId(null);
                    }}
                    onSuccess={async () => {
                        await loadRows();
                        onDataChanged?.();
                    }}
                />
            )}

            {selectedUpgradeRow && (
                <UpgradeDialog
                    subscriptionId={selectedUpgradeRow.id}
                    currentPlan={selectedUpgradeRow.plan_type}
                    isOpen={upgradeDialogOpen}
                    onClose={() => {
                        setUpgradeDialogOpen(false);
                        setSelectedUpgradeRow(null);
                    }}
                    onSuccess={async () => {
                        await loadRows();
                        onDataChanged?.();
                    }}
                />
            )}
        </div>
    );
}
