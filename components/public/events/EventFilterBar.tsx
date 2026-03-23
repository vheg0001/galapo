"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionItem {
    id: string;
    name: string;
    slug: string;
}

interface EventFilterBarProps {
    categories: OptionItem[];
    barangays: OptionItem[];
}

const periodOptions = [
    { value: "upcoming", label: "Upcoming" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "past", label: "Past Events" },
] as const;

const typeOptions = [
    { value: "all", label: "All" },
    { value: "city", label: "City Events" },
    { value: "business", label: "Business Events" },
] as const;

export default function EventFilterBar({ categories, barangays }: EventFilterBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

    const activePeriod = searchParams.get("period") || "upcoming";
    const activeType = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "";
    const barangay = searchParams.get("barangay") || "";

    const hasFilters = useMemo(
        () => Boolean(category || barangay || searchParams.get("search") || activePeriod !== "upcoming" || activeType !== "all"),
        [activePeriod, activeType, barangay, category, searchParams]
    );

    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (!value) params.delete(key);
            else params.set(key, value);
        });
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateParams({ search: searchValue.trim() || null });
    };

    return (
        <div className="space-y-4 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
                {periodOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => updateParams({ period: option.value })}
                        className={cn(
                            "rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all",
                            activePeriod === option.value
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                                : "border border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
                <div className="space-y-2">
                    <label htmlFor="event-category" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Category
                    </label>
                    <select
                        id="event-category"
                        value={category}
                        onChange={(event) => updateParams({ category: event.target.value || null })}
                        className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    >
                        <option value="">All categories</option>
                        {categories.map((item) => (
                            <option key={item.id} value={item.slug}>{item.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="event-type" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Type
                    </label>
                    <div className="grid h-11 grid-cols-3 rounded-2xl border border-border bg-background p-1">
                        {typeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateParams({ type: option.value })}
                                className={cn(
                                    "rounded-xl px-2 text-xs font-bold transition-colors",
                                    activeType === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="event-barangay" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Barangay
                    </label>
                    <select
                        id="event-barangay"
                        value={barangay}
                        onChange={(event) => updateParams({ barangay: event.target.value || null })}
                        className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                    >
                        <option value="">All barangays</option>
                        {barangays.map((item) => (
                            <option key={item.id} value={item.slug}>{item.name}</option>
                        ))}
                    </select>
                </div>

                <form id="event-search-form" onSubmit={onSubmit} className="space-y-2">
                    <label htmlFor="event-search" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            id="event-search"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Search event titles"
                            className="h-11 w-full rounded-2xl border border-border bg-background pl-11 pr-11 text-sm outline-none transition focus:border-primary"
                        />
                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchValue("");
                                    updateParams({ search: null });
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </form>

                {hasFilters ? (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchValue("");
                            const params = new URLSearchParams(searchParams.toString());
                            ["period", "type", "category", "barangay", "search", "page"].forEach((key) => params.delete(key));
                            router.push(`${pathname}?${params.toString()}`, { scroll: false });
                        }}
                        className="mt-[1.7rem] inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted"
                    >
                        Clear Filters
                    </button>
                ) : (
                    <button
                        type="submit"
                        form="event-search-form"
                        className="mt-[1.7rem] inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                    >
                        Search
                    </button>
                )}
            </div>
        </div>
    );
}