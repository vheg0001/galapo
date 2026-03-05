"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ListingStatusTabs, { ListingStatusTab } from "./ListingStatusTabs";

export interface ListingsFiltersValue {
    status: ListingStatusTab;
    category_id: string;
    subcategory_id: string;
    barangay_id: string;
    plan: "all" | "free" | "featured" | "premium";
    owner_type: "all" | "has_owner" | "pre_populated";
    active: "all" | "true" | "false";
    date_from: string;
    date_to: string;
}

interface SelectItem {
    id: string;
    name: string;
    parent_id?: string | null;
}

interface ListingsFilterBarProps {
    filters: ListingsFiltersValue;
    counts: Record<ListingStatusTab, number>;
    categories: SelectItem[];
    subcategories: SelectItem[];
    barangays: SelectItem[];
    search: string;
    onSearchChange: (value: string) => void;
    onChange: (next: Partial<ListingsFiltersValue>) => void;
    onClear: () => void;
}

export default function ListingsFilterBar({
    filters,
    counts,
    categories,
    subcategories,
    barangays,
    search,
    onSearchChange,
    onChange,
    onClear,
}: ListingsFilterBarProps) {
    const [showMore, setShowMore] = useState(false);

    const filteredSubcategories = useMemo(() => {
        if (!filters.category_id) return subcategories;
        return subcategories.filter((s) => s.parent_id === filters.category_id);
    }, [filters.category_id, subcategories]);

    return (
        <div className="space-y-4 rounded-[2rem] border border-border/50 bg-background/50 p-5 shadow-sm backdrop-blur-xl ring-1 ring-border/50">
            <ListingStatusTabs value={filters.status} counts={counts} onChange={(status) => onChange({ status })} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search business name, email, phone..."
                        className="h-11 w-full rounded-xl border border-border/50 bg-muted/30 pl-4 pr-10 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowMore((v) => !v)}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/50 bg-background px-4 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-muted"
                    >
                        {showMore ? "Less Filters" : "More Filters"}
                        {showMore ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="h-11 rounded-xl px-4 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {showMore && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Category</label>
                        <select
                            value={filters.category_id}
                            onChange={(e) => onChange({ category_id: e.target.value, subcategory_id: "" })}
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Subcategory</label>
                        <select
                            value={filters.subcategory_id}
                            onChange={(e) => onChange({ subcategory_id: e.target.value })}
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none"
                        >
                            <option value="">All Subcategories</option>
                            {filteredSubcategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Location</label>
                        <select
                            value={filters.barangay_id}
                            onChange={(e) => onChange({ barangay_id: e.target.value })}
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none"
                        >
                            <option value="">All Barangays</option>
                            {barangays.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Subscription Plan</label>
                        <select
                            value={filters.plan}
                            onChange={(e) => onChange({ plan: e.target.value as any })}
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none"
                        >
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="featured">Featured</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Ownership</label>
                        <select
                            value={filters.owner_type}
                            onChange={(e) => onChange({ owner_type: e.target.value as any })}
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="has_owner">Claimed / Has Owner</option>
                            <option value="pre_populated">Pre-populated</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Visibility</label>
                        <select
                            value={filters.active}
                            onChange={(e) => onChange({ active: e.target.value as any })}
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="true">Active Only</option>
                            <option value="false">Inactive Only</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Date From</label>
                        <input
                            value={filters.date_from}
                            onChange={(e) => onChange({ date_from: e.target.value })}
                            type="date"
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">Date To</label>
                        <input
                            value={filters.date_to}
                            onChange={(e) => onChange({ date_to: e.target.value })}
                            type="date"
                            className="h-10 w-full rounded-xl border border-border/50 bg-muted/30 px-3 text-sm font-medium transition-colors focus:border-primary/50 focus:bg-background outline-none text-muted-foreground"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
