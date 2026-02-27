"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Search } from "lucide-react";
import { POPULAR_TAGS } from "@/lib/constants";

interface SearchBarProps {
    categories?: { id: string; name: string; slug: string }[];
    variant?: "hero" | "compact";
}

export default function SearchBar({ categories = [], variant = "hero" }: SearchBarProps) {
    const router = useRouter();
    const { query, setQuery, categoryId, setCategoryId } = useAppStore();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (categoryId) params.set("category", categoryId);
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
                    <div className="relative flex-1">
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
                        <select
                            value={categoryId || ""}
                            onChange={(e) => setCategoryId(e.target.value || null)}
                            className="h-14 rounded-2xl border-0 bg-white px-4 text-sm text-foreground focus:outline-none sm:h-12 sm:rounded-none sm:border-l sm:border-border"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.slug}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Search button */}
                    <button
                        type="submit"
                        className="h-14 rounded-2xl bg-secondary px-8 text-sm font-semibold text-white transition-colors hover:bg-secondary/90 sm:h-12 sm:rounded-xl"
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
