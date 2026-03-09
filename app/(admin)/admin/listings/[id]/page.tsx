"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ChevronLeft, ChevronDown, Star, Eye, EyeOff, ExternalLink } from "lucide-react";
import StatusBadge from "@/components/admin/shared/StatusBadge";
import ListingDetailView from "@/components/admin/listings/ListingDetailView";
import ListingMetaCard from "@/components/admin/listings/ListingMetaCard";
import OwnerInfoCard from "@/components/admin/listings/OwnerInfoCard";
import AnalyticsSummary from "@/components/admin/listings/AnalyticsSummary";
import AdminNotesSection from "@/components/admin/listings/AdminNotesSection";
import BadgeAssignment from "@/components/admin/listings/BadgeAssignment";
import RejectionModal from "@/components/admin/listings/RejectionModal";
import ApprovalDialog from "@/components/admin/listings/ApprovalDialog";
import HardDeleteModal from "@/components/admin/shared/HardDeleteModal";
import { Trash2, Award } from "lucide-react";

export default function AdminListingDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReject, setShowReject] = useState(false);
    const [showApprove, setShowApprove] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [showHardDelete, setShowHardDelete] = useState(false);
    const [hardDeleteLoading, setHardDeleteLoading] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useClickOutside(actionsRef, () => setShowActions(false));

    async function load() {
        setLoading(true);
        const res = await fetch(`/api/admin/listings/${id}`, { cache: "no-store" });
        const json = await res.json();
        setData(json);
        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function runAction(action: string, reason?: string) {
        if (action === "delete_soft") {
            const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/admin/listings");
                return;
            }
        }

        // If the listing is in claimed_pending state, use the dedicated claims API
        if (listing?.status === "claimed_pending" && (action === "approve" || action === "reject")) {
            const res = await fetch(`/api/admin/claims/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, reason }),
            });
            if (!res.ok) {
                const json = await res.json();
                alert(json.error || "Action failed");
            }
        } else {
            await fetch(`/api/admin/listings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, reason }),
            });
        }
        await load();
    }

    async function handleHardDelete() {
        setHardDeleteLoading(true);
        try {
            const res = await fetch(`/api/admin/listings/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hard: true, confirmation: "DELETE" }),
            });
            if (res.ok) {
                router.push("/admin/listings");
                return;
            } else {
                const err = await res.json();
                alert(err.error || "Hard delete failed");
            }
        } catch (error) {
            console.error("Hard delete failed:", error);
        } finally {
            setHardDeleteLoading(false);
            setShowHardDelete(false);
        }
    }

    if (loading) return <div className="py-8 text-sm text-muted-foreground">Loading listing...</div>;
    if (!data?.listing) return <div className="py-8 text-sm text-red-600">Listing not found.</div>;

    const listing = {
        ...data.listing,
        images: data.images ?? [],
        field_values: data.dynamic_field_values ?? []
    };
    const isActive = !!listing.is_active;
    const isFeatured = !!listing.is_featured;

    const rawAnalytics = data.analytics ?? data.analytics_summary ?? {};
    const analytics = {
        total: rawAnalytics.total ?? rawAnalytics.total_views ?? 0,
        views_this_month: rawAnalytics.views_this_month ?? 0,
        phone: rawAnalytics.phone ?? rawAnalytics.phone_clicks ?? 0,
        email: rawAnalytics.email ?? rawAnalytics.email_clicks ?? 0,
        website: rawAnalytics.website ?? rawAnalytics.website_clicks ?? 0,
        direction: rawAnalytics.direction ?? rawAnalytics.directions ?? rawAnalytics.directions_clicks ?? 0,
        daily_views_30d: Array.isArray(rawAnalytics.daily_views_30d)
            ? rawAnalytics.daily_views_30d
            : Array.isArray(rawAnalytics.daily_views)
                ? rawAnalytics.daily_views.map((item: any) => ({
                    date: item.date,
                    views: item.views ?? item.count ?? 0,
                }))
                : [],
    };
    const ownerListingsCount = data.owner_listings_count ?? data.owner_total_listings ?? 0;
    const subscription = data.subscription ?? data.current_subscription ?? null;
    const notes = data.notes ?? data.admin_notes ?? [];
    const canApprove = listing.status === "pending" || listing.status === "claimed_pending";
    const canReject = listing.status === "pending";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/listings")}
                        className="group flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-95"
                        title="Back to listings"
                    >
                        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-foreground">{listing.business_name}</h1>
                            <StatusBadge status={listing.status} className="h-6" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">ID: {listing.id} • Last updated {new Date(listing.updated_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canApprove && (
                        <button
                            type="button"
                            onClick={() => setShowApprove(true)}
                            className="flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95"
                        >
                            Approve
                        </button>
                    )}
                    {canReject && (
                        <button
                            type="button"
                            onClick={() => setShowReject(true)}
                            className="flex h-10 items-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 hover:scale-[1.02] active:scale-95"
                        >
                            Reject
                        </button>
                    )}

                    {listing.status === "approved" && (
                        <Link
                            href={`/admin/deals/new?listing_id=${id}`}
                            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                        >
                            Add Deal
                        </Link>
                    )}

                    <div className="h-8 w-px bg-border/50 mx-1" />

                    <Link
                        href={`/admin/listings/${id}/edit`}
                        className="flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 text-xs font-bold text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-95"
                    >
                        Edit
                    </Link>

                    <div className="relative" ref={actionsRef}>
                        <button
                            type="button"
                            onClick={() => setShowActions(!showActions)}
                            className={cn(
                                "flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 text-xs font-bold text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground active:scale-95",
                                showActions && "bg-muted text-foreground ring-2 ring-primary/20"
                            )}
                        >
                            Actions
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showActions && "rotate-180")} />
                        </button>

                        {showActions && (
                            <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1.5 space-y-0.5" onClick={() => setShowActions(false)}>
                                    <button
                                        type="button"
                                        onClick={() => runAction("toggle_active")}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted"
                                    >
                                        {isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        Set {isActive ? "Inactive" : "Active"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => runAction("toggle_featured")}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted"
                                    >
                                        <Star className={cn("h-3.5 w-3.5", isFeatured && "fill-amber-500 text-amber-500")} />
                                        {isFeatured ? "Remove Featured" : "Set as Featured"}
                                    </button>

                                    {listing.status === "approved" && (
                                        <>
                                            <div className="my-1.5 h-px bg-border/50" />
                                            <a
                                                href={`/listing/${listing.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                View Public Page
                                            </a>
                                        </>
                                    )}

                                    <div className="my-1.5 h-px bg-border/50" />
                                    {listing.status === "deactivated" ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowHardDelete(true)}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-red-600 transition-colors hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete Permanent
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => runAction("delete_soft")}
                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete (Soft)
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
                <div className="lg:col-span-7">
                    <ListingDetailView listing={listing} deals={data.deals ?? []} events={data.events ?? []} />
                </div>
                <div className="space-y-4 lg:col-span-3">
                    <ListingMetaCard listing={listing} onToggleActive={() => runAction("toggle_active")} onToggleFeatured={() => runAction("toggle_featured")} />
                    <OwnerInfoCard
                        listing={listing}
                        ownerListingsCount={ownerListingsCount}
                        onApproveClaim={() => runAction("approve")}
                        onRejectClaim={() => setShowReject(true)}
                    />
                    <BadgeAssignment listingId={listing.id} />
                    <div className="rounded-xl border border-border bg-background p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Subscription</h3>
                        {subscription ? (
                            <div className="mt-3 space-y-1 text-sm">
                                <p>Plan: {subscription.plan_type}</p>
                                <p>Status: {subscription.status}</p>
                                <p>Start: {new Date(subscription.start_date).toLocaleDateString()}</p>
                                <p>End: {new Date(subscription.end_date).toLocaleDateString()}</p>
                                <a href={`/admin/payments?listing_id=${listing.id}`} className="text-xs text-blue-600 underline">Payment history</a>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">No subscription record.</p>
                        )}
                    </div>
                    <AnalyticsSummary analytics={analytics} />
                    <AdminNotesSection listingId={listing.id} initialNotes={notes} />
                </div>
            </div>

            <ApprovalDialog
                open={showApprove}
                onClose={() => setShowApprove(false)}
                onConfirm={async () => {
                    await runAction("approve");
                    setShowApprove(false);
                }}
            />

            <RejectionModal
                open={showReject}
                onClose={() => setShowReject(false)}
                onSubmit={async (reason) => {
                    await runAction("reject", reason);
                    setShowReject(false);
                }}
            />

            <HardDeleteModal
                open={showHardDelete}
                itemName={listing.business_name}
                loading={hardDeleteLoading}
                onClose={() => setShowHardDelete(false)}
                onConfirm={handleHardDelete}
            />
        </div>
    );
}
