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
            const scrollPos = window.scrollY + 120; // Trigger slightly before the heading hits the top

            // Find the heading that is currently "active"
            // This is the last heading that has a top position less than scrollPos
            let current = validHeadings[0].id;
            for (const heading of validHeadings) {
                const element = document.getElementById(heading.id);
                if (element && element.offsetTop <= scrollPos) {
                    current = heading.id;
                } else {
                    break;
                }
            }

            setActiveId(current);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [validHeadings]);

    if (validHeadings.length === 0) return null;

    return (
        <nav className="hidden rounded-2xl border border-border bg-card p-5 shadow-sm lg:block" aria-label="Table of contents">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">On this page</h2>
            <ul className="mt-4 space-y-1">
                {validHeadings.map((heading) => (
                    <li key={heading.id} className={cn(heading.level === 3 && "pl-4")}>
                        <button
                            type="button"
                            onClick={() => {
                                const element = document.getElementById(heading.id);
                                if (element) {
                                    const top = element.getBoundingClientRect().top + window.scrollY - 100;
                                    window.scrollTo({ top, behavior: "smooth" });
                                }
                            }}
                            className={cn(
                                "block w-full text-left text-sm transition-all duration-200 py-1 border-l-2 pl-3 -ml-[21px]",
                                activeId === heading.id 
                                    ? "font-bold text-primary border-primary bg-primary/5" 
                                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
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