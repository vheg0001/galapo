"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Search } from "lucide-react";
import { POPULAR_TAGS } from "@/lib/constants";
import { CustomSelect } from "./CustomSelect";

interface SearchBarProps {
    categories?: { id: string; name: string; slug: string }[];
    barangays?: { name: string }[];
    variant?: "hero" | "compact";
}

export default function SearchBar({ categories = [], barangays = [], variant = "hero" }: SearchBarProps) {
    const router = useRouter();
    const { query, setQuery, categoryId, setCategoryId, barangay, setBarangay } = useAppStore();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (categoryId) params.set("category", categoryId);
        if (barangay) params.set("barangay", barangay);
        router.push(`/search?${params.toString()}`);
    };

    if (variant === "compact") {
        return (
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    placeholder="Search businesses..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </form>
        );
    }

    return (
        <div className="mx-auto w-full max-w-3xl">
            <form onSubmit={handleSearch}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0 sm:rounded-2xl sm:bg-white sm:p-2 sm:shadow-xl">
                    {/* Text input */}
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="What are you looking for?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-14 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:rounded-none sm:rounded-l-xl sm:h-12"
                        />
                    </div>

                    {/* Category select */}
                    {categories.length > 0 && (
                        <div className="relative group min-w-[160px]">
                            <CustomSelect
                                value={categoryId || ""}
                                onChange={(val) => setCategoryId(val || null)}
                                placeholder="All Categories"
                                options={categories.map((c) => ({ value: c.slug, label: c.name }))}
                                buttonClassName="h-14 w-full rounded-2xl border-0 bg-white px-4 text-sm text-foreground transition-colors duration-300 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 sm:h-12 sm:rounded-none sm:border-l sm:border-border cursor-pointer group-hover:bg-slate-50"
                            />
                        </div>
                    )}

                    {/* Barangay select */}
                    {barangays.length > 0 && (
                        <div className="relative group min-w-[160px]">
                            <CustomSelect
                                value={barangay || ""}
                                onChange={(val) => setBarangay(val || null)}
                                placeholder="All Barangays"
                                options={barangays.map((b) => ({ value: b.name, label: b.name }))}
                                buttonClassName="h-14 w-full rounded-2xl border-0 bg-white px-4 text-sm text-foreground transition-colors duration-300 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50 sm:h-12 sm:rounded-none sm:border-l sm:border-border cursor-pointer group-hover:bg-slate-50"
                            />
                        </div>
                    )}

                    {/* Search button */}
                    <button
                        type="submit"
                        className="h-14 rounded-2xl bg-secondary px-8 text-sm font-semibold text-white transition-colors duration-300 hover:bg-secondary/90 hover:shadow-lg sm:h-12 sm:rounded-xl ml-2 sm:ml-0"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Popular tags */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-primary-foreground/60">Popular:</span>
                {POPULAR_TAGS.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => {
                            setQuery(tag);
                            router.push(`/search?q=${encodeURIComponent(tag)}`);
                        }}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-primary-foreground/80 transition-colors hover:bg-white/20 hover:text-white backdrop-blur-sm border border-white/10"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}
