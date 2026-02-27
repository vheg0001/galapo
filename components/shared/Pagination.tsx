"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath: string;
    className?: string;
}

export default function Pagination({ currentPage, totalPages, basePath, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push("...");
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
    }

    const getHref = (page: number) => `${basePath}?page=${page}`;

    return (
        <nav className={cn("flex items-center justify-center gap-1", className)} aria-label="Pagination">
            <Link
                href={getHref(Math.max(1, currentPage - 1))}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                    currentPage === 1
                        ? "pointer-events-none text-muted-foreground/40"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Link>

            {pages.map((page, i) =>
                page === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
                ) : (
                    <Link
                        key={page}
                        href={getHref(page)}
                        className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                            page === currentPage
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        aria-current={page === currentPage ? "page" : undefined}
                    >
                        {page}
                    </Link>
                )
            )}

            <Link
                href={getHref(Math.min(totalPages, currentPage + 1))}
                className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                    currentPage === totalPages
                        ? "pointer-events-none text-muted-foreground/40"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Link>
        </nav>
    );
}
