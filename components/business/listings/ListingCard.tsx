"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ListingCard (Business Version) (Module 9.1)
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { Edit2, Eye, ExternalLink, MoreVertical, Trash2, AlertCircle } from "lucide-react";
import type { BusinessListing } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ListingCardProps {
    listing: BusinessListing;
    onDelete?: (id: string) => void;
}

export default function ListingCard({ listing, onDelete }: ListingCardProps) {
    const statusColors: Record<string, string> = {
        approved: "bg-green-100 text-green-700 border-green-200",
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        rejected: "bg-red-100 text-red-700 border-red-200",
        claimed_pending: "bg-blue-100 text-blue-700 border-blue-200",
        draft: "bg-gray-100 text-gray-700 border-gray-200",
    };

    const planColors: Record<string, string> = {
        free: "bg-gray-50 text-gray-500 border-gray-100",
        basic: "bg-blue-50 text-blue-500 border-blue-100",
        premium: "bg-purple-50 text-purple-600 border-purple-100",
        enterprise: "bg-amber-50 text-amber-600 border-amber-100",
    };

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:border-[#FF6B35]/20 hover:shadow-xl hover:shadow-[#FF6B35]/5">
            {/* Header Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                {listing.logo_url ? (
                    <img src={listing.logo_url} alt={listing.business_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageIcon size={40} />
                    </div>
                )}

                {/* Status Badge */}
                <div className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${statusColors[listing.status] || statusColors.pending}`}>
                    {listing.status.replace("_", " ")}
                </div>

                {/* Plan Badge */}
                <div className={`absolute right-3 top-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${planColors[listing.plan_type] || planColors.free}`}>
                    {listing.plan_type}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
                <div className="mb-1 flex items-start justify-between">
                    <h3 className="line-clamp-1 font-bold text-gray-900 group-hover:text-[#FF6B35] transition">{listing.business_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Eye size={12} />
                        {(listing as any).views_count || 0}
                    </div>
                </div>

                <p className="mb-4 line-clamp-1 text-xs text-gray-500">
                    {listing.categories?.name} {listing.subcategory?.name ? `• ${listing.subcategory.name}` : ""}
                </p>

                <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        <span>Updated {formatDate(listing.updated_at)}</span>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={`/business/listings/${listing.id}/edit`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#FF6B35]/5 py-2 text-xs font-bold text-[#FF6B35] transition hover:bg-[#FF6B35] hover:text-white"
                        >
                            <Edit2 size={13} />
                            Edit
                        </Link>
                        <Link
                            href={`/listing/${listing.slug}`}
                            target="_blank"
                            className="flex items-center justify-center rounded-lg bg-gray-50 px-3 py-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                            title="View Public Page"
                        >
                            <ExternalLink size={14} />
                        </Link>
                        <button
                            type="button"
                            onClick={() => onDelete?.(listing.id)}
                            className="flex items-center justify-center rounded-lg bg-gray-50 px-3 py-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Delete Listing"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Re-approval Alert */}
            {listing.status === "approved" && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-green-500" />
            )}
        </div>
    );
}

function ImageIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    );
}
