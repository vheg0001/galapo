"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import { useRef } from "react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Barangay {
    id: string;
    name: string;
    slug: string;
}

interface DealFilterBarProps {
    categories: Category[];
    barangays: Barangay[];
}

export default function DealFilterBar({ categories, barangays }: DealFilterBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const scrollRef = useRef<HTMLDivElement>(null);

    const selectedCategory = searchParams.get("category");
    const selectedBarangay = searchParams.get("barangay");
    const selectedSort = searchParams.get("sort") || "expiring_soon";

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page"); // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push(pathname, { scroll: false });
    };

    const hasFilters = selectedCategory || selectedBarangay || selectedSort !== "expiring_soon";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                {/* Row 1: Category Chips - Scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide md:flex-wrap md:pb-0">
                    <button
                        onClick={() => updateFilter("category", null)}
                        className={cn(
                            "whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all shrink-0",
                            !selectedCategory
                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                : "bg-background border border-border/50 text-muted-foreground hover:bg-muted"
                        )}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => updateFilter("category", cat.slug)}
                            className={cn(
                                "whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all shrink-0",
                                selectedCategory === cat.slug
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20 scale-105"
                                    : "bg-background border border-border/50 text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Row 2: Secondary Filters Bar */}
                <div className="flex flex-col gap-4 py-4 border-t border-border/30 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground/60">
                        <div className="h-px w-6 bg-border/50" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Refine Results</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Barangay Filter */}
                        <div className="relative group">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                            <select
                                value={selectedBarangay || ""}
                                onChange={(e) => updateFilter("barangay", e.target.value || null)}
                                className="h-11 w-full md:w-48 appearance-none rounded-2xl border border-border/50 bg-background/50 pl-10 pr-10 text-xs font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none"
                            >
                                <option value="">All Barangays</option>
                                {barangays.map((b) => (
                                    <option key={b.id} value={b.slug || b.name}>{b.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-border/50 pl-2">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 rotate-90" />
                            </div>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative group">
                            <select
                                value={selectedSort}
                                onChange={(e) => updateFilter("sort", e.target.value)}
                                className="h-11 w-full md:w-40 appearance-none rounded-2xl border border-border/50 bg-background/50 px-4 pr-10 text-xs font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none"
                            >
                                <option value="expiring_soon">⏳ Expiring Soon</option>
                                <option value="newest">🆕 Newest</option>
                                <option value="category">📂 Category</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-border/50 pl-2">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 rotate-90" />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex h-11 items-center gap-2 rounded-2xl bg-red-50 px-5 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100 active:scale-95"
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
