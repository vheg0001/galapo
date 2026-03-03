"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — My Listings Page (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Loader2, LayoutGrid, List as ListIcon, AlertCircle } from "lucide-react";
import ListingCard from "@/components/business/listings/ListingCard";
import type { BusinessListing } from "@/lib/types";

export default function MyListingsPage() {
    const [listings, setListings] = useState<BusinessListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        async function fetchListings() {
            try {
                const res = await fetch("/api/business/listings");
                const data = await res.json();
                setListings(data.data || []);
            } catch (err) {
                console.error("Failed to fetch listings", err);
            } finally {
                setLoading(false);
            }
        }
        fetchListings();
    }, []);

    const filteredListings = listings.filter(l =>
        (filter === "all" || l.status === filter) &&
        (l.business_name.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this listing? it will be hidden from the public.")) return;
        try {
            const res = await fetch(`/api/business/listings/${id}`, { method: "DELETE" });
            if (res.ok) {
                setListings(listings.filter(l => l.id !== id));
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <div className="space-y-8 p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">My Listings</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your business presence on GalaPo.</p>
                </div>
                <Link
                    href="/business/listings/new"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/20 transition hover:bg-[#FF6B35]/90 active:scale-95"
                >
                    <Plus size={18} />
                    Add New Listing
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search your listings..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-600 focus:border-[#FF6B35] focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Live / Approved</option>
                        <option value="pending">Pending Review</option>
                        <option value="draft">Drafts</option>
                        <option value="claimed_pending">Claim Pending</option>
                    </select>
                </div>
            </div>

            {/* List / Grid */}
            {loading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="animate-spin text-[#FF6B35]" />
                    <p className="text-sm font-medium text-gray-400">Loading your listings...</p>
                </div>
            ) : filteredListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-20 text-center">
                    <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-300">
                        <ListIcon size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No listings found</h3>
                    <p className="mt-1 max-w-xs text-sm text-gray-500">
                        {search || filter !== "all"
                            ? "Try adjusting your filters or search terms."
                            : "Create your first business listing to get started on GalaPo."}
                    </p>
                    {!(search || filter !== "all") && (
                        <Link
                            href="/business/listings/new"
                            className="mt-6 font-bold text-[#FF6B35] hover:underline"
                        >
                            Create a listing now →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredListings.map((listing) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
