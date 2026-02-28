"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface NoResultsProps {
    query: string;
    popularCategories: Category[];
    onClearFilters: () => void;
}

export default function NoResults({ query, popularCategories, onClearFilters }: NoResultsProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Illustration */}
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/80">
                <SearchX className="h-12 w-12 text-muted-foreground/50" />
            </div>

            <h2 className="text-xl font-bold text-foreground">
                {query ? `No results for "${query}"` : "No businesses found"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                We couldn&apos;t find any businesses matching your search. Try adjusting your filters or exploring different categories.
            </p>

            {/* Suggestions */}
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <li>✦ Try different or shorter keywords</li>
                <li>✦ Remove some active filters</li>
                <li>✦ Check your spelling</li>
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                    onClick={onClearFilters}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                    Clear Filters
                </button>
                <Link
                    href="/olongapo/categories"
                    className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
                >
                    Browse All Categories
                </Link>
            </div>

            {/* Popular categories fallback */}
            {popularCategories.length > 0 && (
                <div className="mt-12 w-full max-w-2xl">
                    <h3 className="mb-4 text-base font-semibold text-foreground">
                        Popular Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {popularCategories.slice(0, 6).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/olongapo/${cat.slug}`}
                                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-secondary/30 hover:shadow-md"
                            >
                                {cat.icon && (
                                    <span className="text-2xl leading-none">{cat.icon}</span>
                                )}
                                <span className="text-sm font-medium text-foreground line-clamp-2">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
