"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ListingsTable Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { DashboardListing } from "@/store/businessStore";

interface ListingsTableProps {
    listings: DashboardListing[];
    loading?: boolean;
}

function StatusBadge({ status }: { status: DashboardListing["status"] }) {
    const map = {
        approved: "bg-green-50 text-green-700 border-green-100",
        pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
        rejected: "bg-red-50 text-red-700 border-red-100",
        claimed_pending: "bg-blue-50 text-blue-700 border-blue-100",
        deactivated: "bg-red-50 text-red-700 border-red-100",
    };
    const labels = {
        approved: "Approved",
        pending: "Pending",
        rejected: "Rejected",
        claimed_pending: "Claim Pending",
        deactivated: "Deactivated",
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
            {labels[status]}
        </span>
    );
}

function PlanBadge({ is_featured, is_premium }: { is_featured: boolean; is_premium: boolean }) {
    if (is_premium) {
        return (
            <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                ⭐ Premium
            </span>
        );
    }
    if (is_featured) {
        return (
            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                🔥 Featured
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-500">
            Free
        </span>
    );
}

export default function ListingsTable({ listings, loading = false }: ListingsTableProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                ))}
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
                <span className="text-4xl">🏪</span>
                <p className="mt-3 text-sm font-medium text-gray-700">No listings yet</p>
                <p className="mt-1 text-xs text-gray-400">
                    Add your first business listing to get started
                </p>
                <Link
                    href="/business/listings/new"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e55a25]"
                >
                    Add Your First Listing
                </Link>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Business
                        </th>
                        <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">
                            Status
                        </th>
                        <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">
                            Plan
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">
                            Views
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {listings.slice(0, 5).map((listing) => (
                        <tr key={listing.id} className="bg-white transition hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                                <Link
                                    href={`/olongapo/${listing.slug}`}
                                    target="_blank"
                                    className="font-medium text-gray-900 hover:text-[#FF6B35] transition"
                                >
                                    {listing.business_name}
                                </Link>
                                <div className="mt-1 flex gap-2 sm:hidden">
                                    <StatusBadge status={listing.status} />
                                </div>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell">
                                <StatusBadge status={listing.status} />
                            </td>
                            <td className="hidden px-4 py-3 md:table-cell">
                                <PlanBadge
                                    is_featured={listing.is_featured}
                                    is_premium={listing.is_premium}
                                />
                            </td>
                            <td className="hidden px-4 py-3 text-right text-gray-600 lg:table-cell">
                                <span className="flex items-center justify-end gap-1">
                                    <Eye size={13} className="text-gray-400" />
                                    {listing.views_this_month.toLocaleString()}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/business/listings/${listing.id}/edit`}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                                        >
                                            <Pencil size={12} />
                                            Edit
                                        </Link>
                                        {listing.status === 'deactivated' && (
                                            <Link
                                                href={`/business/subscription?listing=${listing.id}&reactivate=true`}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
                                            >
                                                Reactivate
                                            </Link>
                                        )}
                                    </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
