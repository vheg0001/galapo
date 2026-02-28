"use client";

import { cn } from "@/lib/utils";

interface SearchResultsHeaderProps {
    query: string;
    total: number;
    className?: string;
}



export default function SearchResultsHeader({
    query,
    total,
    className,
}: SearchResultsHeaderProps) {
    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
            <div>
                <h1 className="text-xl font-bold text-foreground">
                    {query ? (
                        <>Results for <span className="text-secondary">&ldquo;{query}&rdquo;</span></>
                    ) : (
                        "All Businesses in Olongapo"
                    )}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {total > 0
                        ? `Found ${total.toLocaleString()} business${total !== 1 ? "es" : ""}`
                        : "No businesses found"}
                </p>
            </div>

        </div>
    );
}
