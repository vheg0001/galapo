"use client";

import Link from "next/link";
interface CategoryCardProps {
    name: string;
    slug: string;
    icon?: string | null;
    listingCount: number;
    subcategories: { name: string }[];
}

export default function CategoryCard({ name, slug, icon, listingCount, subcategories }: CategoryCardProps) {
    const maxVisible = 5;
    const visibleSubs = subcategories.slice(0, maxVisible);
    const overflow = subcategories.length - maxVisible;

    return (
        <Link
            href={`/olongapo/${slug}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-l-4 hover:border-l-muted-foreground/50"
        >
            {/* Icon + Name */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-muted-foreground/10 group-hover:text-foreground">
                    <span className="text-xl">{icon || "📁"}</span>
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-foreground transition-colors">
                        {name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {listingCount} {listingCount === 1 ? "listing" : "listings"}
                    </p>
                </div>
            </div>

            {/* Subcategories */}
            {visibleSubs.length > 0 && (
                <div className="mt-auto pt-3 border-t border-border/50">
                    <ul className="flex flex-wrap gap-1.5">
                        {visibleSubs.map((sub: { name: string }) => (
                            <li
                                key={sub.name}
                                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                            >
                                {sub.name}
                            </li>
                        ))}
                        {overflow > 0 && (
                            <li className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-primary">
                                +{overflow} more
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </Link>
    );
}
