"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Listing {
    id: string;
    business_name: string;
    [key: string]: any;
}

interface ListingSearchSelectProps {
    listings: Listing[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
    className?: string;
}

export default function ListingSearchSelect({
    listings,
    value,
    onChange,
    placeholder = "Search for a business...",
    className
}: ListingSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Find the currently selected listing
    const selectedListing = useMemo(() =>
        listings.find((l) => l.id === value),
        [listings, value]);

    // Update search query when value changes or when selectedListing is found
    useEffect(() => {
        if (selectedListing) {
            setSearchQuery(selectedListing.business_name);
        } else {
            setSearchQuery("");
        }
    }, [selectedListing]);

    // Filter listings based on search query
    const filteredListings = useMemo(() => {
        if (!searchQuery || selectedListing?.business_name === searchQuery) return listings.slice(0, 10);

        return listings
            .filter((l) =>
                l.business_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 10);
    }, [listings, searchQuery, selectedListing]);

    // Handle clicking outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
                // Reset search query if nothing selected and we're closing
                if (selectedListing) {
                    setSearchQuery(selectedListing.business_name);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedListing]);

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setOpen(true);
                    }}
                    placeholder={placeholder}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-11 pr-10 py-3 text-sm font-bold transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                />
                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setSearchQuery("");
                                setOpen(true);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
                </div>
            </div>

            {open && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-xl animate-in fade-in zoom-in-95 slide-in-from-top-2">
                    <div className="max-h-60 overflow-y-auto p-2">
                        {filteredListings.length > 0 ? (
                            filteredListings.map((listing) => (
                                <button
                                    key={listing.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(listing.id);
                                        setSearchQuery(listing.business_name);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-primary/5",
                                        value === listing.id ? "bg-primary/10 text-primary" : "text-gray-700"
                                    )}
                                >
                                    <div className="flex-1 truncate">
                                        <span className="font-bold">{listing.business_name}</span>
                                        {listing.address && (
                                            <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wider line-clamp-1">
                                                {listing.address}
                                            </span>
                                        )}
                                    </div>
                                    {value === listing.id && <Check className="h-4 w-4 shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No businesses found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
