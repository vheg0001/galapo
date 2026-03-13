"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { BlogLinkedListing } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface InsertListingModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (listing: BlogLinkedListing) => void;
}

export default function InsertListingModal({ open, onClose, onSelect }: InsertListingModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<BlogLinkedListing[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        let active = true;

        async function searchListings() {
            setLoading(true);
            const supabase = createBrowserSupabaseClient();
            let request = supabase
                .from("listings")
                .select("id, slug, business_name, short_description, logo_url, is_featured, is_premium, categories!listings_category_id_fkey(name, slug), barangays(name, slug)")
                .eq("is_active", true)
                .in("status", ["approved", "claimed_pending"])
                .limit(8);

            if (query.trim()) {
                request = request.ilike("business_name", `%${query.trim()}%`);
            }

            const { data } = await request;
            if (!active) return;

            setResults(
                (data ?? []).map((item: any) => ({
                    id: item.id,
                    slug: item.slug,
                    business_name: item.business_name,
                    short_description: item.short_description,
                    logo_url: item.logo_url,
                    is_featured: item.is_featured,
                    is_premium: item.is_premium,
                    category: item.categories ?? null,
                    barangay: item.barangays ?? null,
                    badges: [],
                }))
            );
            setLoading(false);
        }

        searchListings();
        return () => {
            active = false;
        };
    }, [open, query]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Insert Listing</h3>
                        <p className="text-sm text-muted-foreground">Search a business listing to mention in your article.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Close</button>
                </div>

                <div className="mt-4">
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by business name..." />
                </div>

                <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
                    {loading ? <p className="text-sm text-muted-foreground">Searching listings...</p> : null}
                    {!loading && results.length === 0 ? <p className="text-sm text-muted-foreground">No listings found.</p> : null}
                    {results.map((listing) => (
                        <button
                            key={listing.id}
                            type="button"
                            onClick={() => {
                                onSelect(listing);
                                onClose();
                            }}
                            className="block w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                        >
                            <p className="font-semibold text-foreground">{listing.business_name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{[listing.category?.name, listing.barangay?.name].filter(Boolean).join(" · ")}</p>
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{listing.short_description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}