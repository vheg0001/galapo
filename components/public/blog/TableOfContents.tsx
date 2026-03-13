"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { BlogHeading } from "@/lib/types";

interface TableOfContentsProps {
    headings: BlogHeading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null);

    const validHeadings = useMemo(() => headings.filter((heading) => heading.text), [headings]);

    useEffect(() => {
        if (validHeadings.length === 0) return;

        const onScroll = () => {
            const current = validHeadings.find((heading) => {
                const element = document.getElementById(heading.id);
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.top <= 160 && rect.bottom >= 160;
            });

            if (current) setActiveId(current.id);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [validHeadings]);

    if (validHeadings.length === 0) return null;

    return (
        <nav className="hidden rounded-2xl border border-border bg-card p-5 shadow-sm lg:block lg:sticky lg:top-24" aria-label="Table of contents">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">On this page</h2>
            <ul className="mt-4 space-y-2">
                {validHeadings.map((heading) => (
                    <li key={heading.id} className={cn(heading.level === 3 && "pl-4")}>
                        <button
                            type="button"
                            onClick={() => {
                                const element = document.getElementById(heading.id);
                                element?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={cn(
                                "text-left text-sm transition-colors hover:text-primary",
                                activeId === heading.id ? "font-semibold text-primary" : "text-muted-foreground"
                            )}
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}